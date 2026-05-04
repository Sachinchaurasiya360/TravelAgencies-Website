import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, NotificationType, NotificationStatus, NotificationChannel } from "@prisma/client";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";
import { sendPaymentReminderNotification } from "@/services/notification.service";

// GET /api/reminders - List payment reminder logs (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);

    const status = searchParams.get("status") as NotificationStatus | null;
    const channel = searchParams.get("channel") as NotificationChannel | null;

    const where: Prisma.NotificationLogWhereInput = {
      type: NotificationType.PAYMENT_REMINDER,
    };

    if (status) where.status = status;
    if (channel) where.channel = channel;

    const [reminders, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        include: {
          booking: {
            select: {
              bookingId: true,
              totalAmount: true,
              paymentStatus: true,
              customer: { select: { id: true, name: true, phone: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.notificationLog.count({ where }),
    ]);

    return successResponse({
      reminders,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Reminders list error:", error);
    return errorResponse("Failed to fetch reminders", 500);
  }
}

// POST /api/reminders - Send a payment reminder (admin only)
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const { bookingId, channel, message } = body;

    if (!bookingId) {
      return errorResponse("Booking ID is required", 400);
    }

    if (!channel || !["EMAIL", "WHATSAPP"].includes(channel)) {
      return errorResponse("Valid channel (EMAIL, WHATSAPP) is required", 400);
    }

    // Fetch booking with customer and assigned party details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        driver: { select: { name: true, phone: true, vehicleName: true, vehicleNumber: true } },
        vendor: { select: { name: true, phone: true } },
      },
    });

    if (!booking) return errorResponse("Booking not found", 404);

    // Send the payment reminder notification via the notification service
    const results = await sendPaymentReminderNotification(
      {
        id: booking.id,
        bookingId: booking.bookingId,
        totalAmount: booking.totalAmount,
        paymentDueDate: booking.paymentDueDate,
        customer: {
          name: booking.customer.name,
          phone: booking.customer.phone,
          email: booking.customer.email,
        },
        driver: booking.driver,
        vendor: booking.vendor,
      },
      [channel as NotificationChannel],
      message || undefined
    );

    return successResponse({ results }, 201);
  } catch (error) {
    console.error("Reminder creation error:", error);
    return errorResponse("Failed to send reminder", 500);
  }
}
