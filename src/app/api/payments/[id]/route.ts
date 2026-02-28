import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// GET /api/payments/[id] - Get payment detail (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            bookingId: true,
            tripType: true,
            vehicleType: true,
            totalAmount: true,
            paymentStatus: true,
          },
        },
        customer: true,
        invoice: { select: { id: true, invoiceNumber: true, grandTotal: true } },
      },
    });

    if (!payment) return errorResponse("Payment not found", 404);

    return successResponse(payment);
  } catch (error) {
    console.error("Payment detail error:", error);
    return errorResponse("Failed to fetch payment", 500);
  }
}

// PATCH /api/payments/[id] - Update payment (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return errorResponse("Payment not found", 404);

    const allowedFields = ["method", "transactionRef", "notes", "paymentDate"];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "paymentDate") {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid fields to update", 400);
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: updateData,
    });

    logActivity({
      action: ActivityAction.PAYMENT_UPDATED,
      description: `Payment ${payment.receiptNumber} updated`,
      userId: session.user.id,
      entityType: "Payment",
      entityId: updated.id,
      metadata: { receiptNumber: payment.receiptNumber, paymentId: updated.id },
    }).catch(console.error);

    return successResponse(updated);
  } catch (error) {
    console.error("Payment update error:", error);
    return errorResponse("Failed to update payment", 500);
  }
}
