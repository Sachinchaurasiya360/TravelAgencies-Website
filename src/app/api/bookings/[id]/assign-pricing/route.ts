import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { assignPricingSchema } from "@/validators/booking.validator";
import { calculateBookingTotal } from "@/lib/helpers/gst";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// PATCH /api/bookings/[id]/assign-pricing - Set pricing on booking (admin + driver)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = assignPricingSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return errorResponse("Booking not found", 404);

    // Driver can only update pricing on their own bookings
    const role = (session.user as { role: string }).role;
    if (role === "DRIVER" && booking.driverId !== session.user.id) {
      return errorResponse("Access denied", 403);
    }

    const totals = calculateBookingTotal({
      baseFare: parsed.data.baseFare,
      tollCharges: parsed.data.tollCharges,
      parkingCharges: parsed.data.parkingCharges,
      driverAllowance: parsed.data.driverAllowance,
      extraCharges: parsed.data.extraCharges,
      discount: parsed.data.discount,
      includeGst: parsed.data.includeGst,
    });

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        baseFare: totals.baseFare,
        taxAmount: totals.taxAmount,
        tollCharges: totals.tollCharges,
        parkingCharges: totals.parkingCharges,
        driverAllowance: totals.driverAllowance,
        extraCharges: totals.extraCharges,
        extraChargesNote: parsed.data.extraChargesNote || null,
        discount: totals.discount,
        totalAmount: totals.totalAmount,
        includeGst: parsed.data.includeGst,
        paymentDueDate: parsed.data.paymentDueDate
          ? new Date(parsed.data.paymentDueDate)
          : null,
      },
    });

    logActivity({
      action: ActivityAction.BOOKING_PRICING_SET,
      description: `Pricing set for booking ${booking.bookingId}: total ${totals.totalAmount}`,
      userId: session.user.id,
      entityType: "Booking",
      entityId: booking.id,
      metadata: { bookingId: booking.bookingId, totalAmount: totals.totalAmount },
    }).catch(console.error);

    return successResponse(updated);
  } catch (error) {
    console.error("Assign pricing error:", error);
    return errorResponse("Failed to assign pricing", 500);
  }
}
