import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { RefundStatus, PaymentStatus, ActivityAction } from "@prisma/client";
import { processRefundSchema } from "@/validators/refund.validator";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { logActivity } from "@/services/activity-log.service";

// GET /api/refunds/[id] - Get refund detail (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            bookingId: true,
            tripType: true,
            vehicleType: true,
            totalAmount: true,
            paymentStatus: true,
            customer: true,
          },
        },
      },
    });

    if (!refund) return errorResponse("Refund not found", 404);

    return successResponse(refund);
  } catch (error) {
    console.error("Refund detail error:", error);
    return errorResponse("Failed to fetch refund", 500);
  }
}

// PATCH /api/refunds/[id] - Process refund (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = processRefundSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;

    const refund = await prisma.refund.findUnique({ where: { id } });
    if (!refund) return errorResponse("Refund not found", 404);

    // Validate status transitions
    const allowedTransitions: Record<string, RefundStatus[]> = {
      [RefundStatus.REQUESTED]: [RefundStatus.APPROVED, RefundStatus.REJECTED],
      [RefundStatus.APPROVED]: [RefundStatus.PROCESSED, RefundStatus.REJECTED],
      [RefundStatus.PROCESSED]: [],
      [RefundStatus.REJECTED]: [],
    };

    const allowed = allowedTransitions[refund.status] || [];
    if (!allowed.includes(data.status)) {
      return errorResponse(
        `Cannot transition refund from ${refund.status} to ${data.status}`,
        400
      );
    }

    const updateData: Record<string, unknown> = {
      status: data.status,
      adminRemarks: data.adminRemarks || null,
    };

    if (data.status === RefundStatus.APPROVED) {
      updateData.approvedAmount = data.approvedAmount ?? refund.requestedAmount;
      updateData.cancellationFee = data.cancellationFee ?? 0;
    }

    if (data.status === RefundStatus.PROCESSED) {
      const approvedAmount = Number(data.approvedAmount ?? refund.approvedAmount ?? refund.requestedAmount);
      const cancellationFee = Number(data.cancellationFee ?? refund.cancellationFee ?? 0);
      updateData.refundedAmount = approvedAmount - cancellationFee;
      updateData.refundMethod = data.refundMethod || null;
      updateData.transactionRef = data.transactionRef || null;
      updateData.processedAt = new Date();

      // Update booking payment status to REFUNDED
      await prisma.booking.update({
        where: { id: refund.bookingId },
        data: { paymentStatus: PaymentStatus.REFUNDED },
      });
    }

    const updated = await prisma.refund.update({
      where: { id },
      data: updateData,
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
      action: ActivityAction.REFUND_PROCESSED,
      description: `Refund ${refund.refundNumber} processed with status ${data.status}`,
      userId: session.user.id,
      entityType: "Refund",
      entityId: updated.id,
      metadata: { refundNumber: refund.refundNumber, bookingId: updated.booking.bookingId, status: data.status },
    }).catch(console.error);

    return successResponse(updated);
  } catch (error) {
    console.error("Refund processing error:", error);
    return errorResponse("Failed to process refund", 500);
  }
}
