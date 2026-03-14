import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, BookingStatus, RefundStatus, ActivityAction } from "@prisma/client";
import { createRefundSchema } from "@/validators/refund.validator";
import { generateRefundNumber } from "@/lib/helpers/booking-id";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";
import { logActivity } from "@/services/activity-log.service";

// GET /api/refunds - List all refunds (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);

    const status = searchParams.get("status") as RefundStatus | null;
    const bookingId = searchParams.get("bookingId");
    const search = searchParams.get("search");

    const where: Prisma.RefundWhereInput = {};

    if (status) where.status = status;
    if (bookingId) where.bookingId = bookingId;

    if (search) {
      where.OR = [
        { refundNumber: { contains: search, mode: "insensitive" } },
        { booking: { bookingId: { contains: search, mode: "insensitive" } } },
        { booking: { customer: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          booking: {
            select: {
              bookingId: true,
              totalAmount: true,
              customer: { select: { id: true, name: true, phone: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ]);

    return successResponse({
      refunds,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Refunds list error:", error);
    return errorResponse("Failed to fetch refunds", 500);
  }
}

// POST /api/refunds - Create a refund request (admin only)
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = createRefundSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
    });

    if (!booking) return errorResponse("Booking not found", 404);

    // Booking must be CANCELLED to request a refund
    if (booking.status !== BookingStatus.CANCELLED) {
      return errorResponse("Refund can only be requested for cancelled bookings", 400);
    }

    // Check requested amount does not exceed total paid
    const totalPaidResult = await prisma.payment.aggregate({
      where: { bookingId: data.bookingId },
      _sum: { amount: true },
    });
    const totalPaid = Number(totalPaidResult._sum.amount || 0);

    if (data.requestedAmount > totalPaid) {
      return errorResponse(
        `Requested refund amount (${data.requestedAmount}) exceeds total paid (${totalPaid})`,
        400
      );
    }

    // Generate refund number
    const refundNumber = await generateRefundNumber();

    const refund = await prisma.refund.create({
      data: {
        refundNumber,
        bookingId: data.bookingId,
        status: RefundStatus.REQUESTED,
        requestedAmount: data.requestedAmount,
        reason: data.reason,
        requestedAt: new Date(),
      },
      include: {
        booking: {
          select: {
            bookingId: true,
            customer: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    logActivity({
      action: ActivityAction.REFUND_REQUESTED,
      description: `Refund ${refund.refundNumber} requested for booking ${refund.booking.bookingId}: ${data.requestedAmount}`,
      userId: session.user.id,
      entityType: "Refund",
      entityId: refund.id,
      metadata: { refundNumber: refund.refundNumber, bookingId: refund.booking.bookingId, requestedAmount: data.requestedAmount },
    }).catch(console.error);

    return successResponse(refund, 201);
  } catch (error) {
    console.error("Refund creation error:", error);
    return errorResponse("Failed to create refund", 500);
  }
}
