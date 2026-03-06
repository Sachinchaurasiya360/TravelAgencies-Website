import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { updateBookingStatusSchema } from "@/validators/booking.validator";
import { ALLOWED_STATUS_TRANSITIONS } from "@/lib/constants";
import { BookingStatus, ActivityAction } from "@prisma/client";
import { sendStatusNotification } from "@/services/notification.service";
import { logActivity } from "@/services/activity-log.service";

// PATCH /api/bookings/[id]/status - Transition booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateBookingStatusSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { status: newStatus, reason } = parsed.data;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return errorResponse("Booking not found", 404);

    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[booking.status];
    if (!allowedTransitions.includes(newStatus)) {
      return errorResponse(
        `Cannot transition from ${booking.status} to ${newStatus}`,
        400
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    switch (newStatus) {
      case BookingStatus.CONFIRMED:
        updateData.confirmedAt = new Date();
        break;
      case BookingStatus.CANCELLED:
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = reason || null;
        break;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: { customer: { select: { name: true, phone: true, email: true } } },
    });

    // Log activity (fire-and-forget)
    logActivity({
      action: ActivityAction.BOOKING_STATUS_CHANGED,
      description: `Booking ${updated.bookingId} status changed from ${booking.status} to ${newStatus}`,
      userId: session.user.id,
      entityType: "Booking",
      entityId: updated.id,
      metadata: { bookingId: updated.bookingId, oldStatus: booking.status, newStatus },
    }).catch(console.error);

    // Send notification on status change (fire-and-forget)
    sendStatusNotification(
      {
        id: updated.id,
        bookingId: updated.bookingId,
        customer: updated.customer,
      },
      newStatus
    ).catch(console.error);

    return successResponse(updated);
  } catch (error) {
    console.error("Status transition error:", error);
    return errorResponse("Failed to update booking status", 500);
  }
}
