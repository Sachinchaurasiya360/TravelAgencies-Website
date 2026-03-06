import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/validators/booking.validator";
import { generateBookingId } from "@/lib/helpers/booking-id";
import {
  successResponse,
  errorResponse,
  requireAuth,
  getClientIp,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";
import { publicBookingLimit } from "@/lib/rate-limit";
import { BookingStatus, Prisma, ActivityAction } from "@prisma/client";

import { sendBookingConfirmation } from "@/services/notification.service";
import { logActivity } from "@/services/activity-log.service";

// POST /api/bookings - Create new booking (public)
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = publicBookingLimit(ip);
  if (!success) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }

  try {
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return errorResponse(firstError.message, 400);
    }

    const data = parsed.data;

    // Clean phone number (remove +91 prefix if present)
    const cleanPhone = data.phone.replace(/^\+91/, "");

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: data.name,
          phone: cleanPhone,
          email: data.email || null,
        },
      });

      logActivity({
        action: ActivityAction.CUSTOMER_CREATED,
        description: `New customer created: ${customer.name} (${customer.phone})`,
        userId: undefined,
        entityType: "Customer",
        entityId: customer.id,
        metadata: { customerName: customer.name, customerPhone: customer.phone },
      }).catch(console.error);
    }

    // Generate booking ID
    const bookingId = await generateBookingId();

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingId,
        customerId: customer.id,
        travelDate: new Date(data.travelDate),
        pickupLocation: data.pickupLocation,
        dropLocation: data.dropLocation,
        pickupTime: data.pickupTime || null,
        status: BookingStatus.PENDING,
      },
    });

    // Log activity (fire-and-forget)
    logActivity({
      action: ActivityAction.BOOKING_CREATED,
      description: `Booking ${booking.bookingId} created for ${customer.name}`,
      userId: undefined,
      entityType: "Booking",
      entityId: booking.id,
      metadata: { bookingId: booking.bookingId },
    }).catch(console.error);

    // Send confirmation notification (fire-and-forget)
    sendBookingConfirmation({
      id: booking.id,
      bookingId: booking.bookingId,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      travelDate: booking.travelDate,
      customer: { name: customer.name, phone: customer.phone, email: customer.email },
    }).catch(console.error);

    return successResponse(
      {
        bookingId: booking.bookingId,
        message: "Booking request submitted successfully. You will receive a confirmation shortly.",
      },
      201
    );
  } catch (error) {
    console.error("Booking creation error:", error);
    return errorResponse("Failed to create booking. Please try again.", 500);
  }
}

// GET /api/bookings - List all bookings (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);

    const status = searchParams.get("status") as BookingStatus | null;
    const paymentStatus = searchParams.get("paymentStatus");
    const search = searchParams.get("search");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: Prisma.BookingWhereInput = {};

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus as Prisma.EnumPaymentStatusFilter;

    if (search) {
      where.OR = [
        { bookingId: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    if (fromDate || toDate) {
      where.travelDate = {};
      if (fromDate) where.travelDate.gte = new Date(fromDate);
      if (toDate) where.travelDate.lte = new Date(toDate);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return successResponse({
      bookings,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Bookings list error:", error);
    return errorResponse("Failed to fetch bookings", 500);
  }
}
