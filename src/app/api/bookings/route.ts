import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/validators/booking.validator";
import { generateBookingId } from "@/lib/helpers/booking-id";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  getClientIp,
  getPaginationParams,
  paginationMeta,
  safeSortField,
  validEnumOrUndefined,
} from "@/lib/api-helpers";
import { publicBookingLimit } from "@/lib/rate-limit";
import { BookingStatus, Prisma, ActivityAction } from "@prisma/client";

import { sendBookingConfirmation } from "@/services/notification.service";
import { logActivity } from "@/services/activity-log.service";

const BOOKING_SORT_FIELDS = ["createdAt", "travelDate", "bookingId", "totalAmount", "paymentStatus"];
const VALID_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"];
const VALID_PAYMENT_STATUSES = ["PENDING", "PARTIAL", "PAID", "OVERDUE"];

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

    // Use upsert to atomically find-or-create customer (prevents race condition)
    const customer = await prisma.customer.upsert({
      where: { phone: cleanPhone },
      update: {},
      create: {
        name: data.name,
        phone: cleanPhone,
        email: data.email || null,
      },
    });

    // Wrap booking ID generation + creation in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      const bookingId = await generateBookingId(tx);

      return tx.booking.create({
        data: {
          bookingId,
          customerId: customer.id,
          travelDate: new Date(data.travelDate),
          pickupLocation: data.pickupLocation,
          dropLocation: data.dropLocation,
          pickupTime: data.pickupTime || null,
          vehiclePreference: data.vehiclePreference || null,
          status: BookingStatus.PENDING,
        },
      });
    });

    // Fire-and-forget logging and notifications
    logActivity({
      action: ActivityAction.BOOKING_CREATED,
      description: `Booking ${booking.bookingId} created for ${customer.name}`,
      userId: undefined,
      entityType: "Booking",
      entityId: booking.id,
      metadata: { bookingId: booking.bookingId },
    }).catch(console.error);

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
    const message = error instanceof Error ? error.message : "Failed to create booking. Please try again.";
    return errorResponse(message, 500);
  }
}

// GET /api/bookings - List all bookings (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);

    const status = validEnumOrUndefined(searchParams.get("status"), VALID_BOOKING_STATUSES);
    const paymentStatus = validEnumOrUndefined(searchParams.get("paymentStatus"), VALID_PAYMENT_STATUSES);
    const search = searchParams.get("search");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: Prisma.BookingWhereInput = {};

    if (status) where.status = status as BookingStatus;
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
          driver: { select: { id: true, name: true } },
        },
        orderBy: { [safeSortField(sortBy, BOOKING_SORT_FIELDS)]: sortOrder },
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
