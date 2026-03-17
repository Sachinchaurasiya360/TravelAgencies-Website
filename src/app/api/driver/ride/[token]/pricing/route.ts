import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { assignPricingSchema } from "@/validators/booking.validator";
import { calculateBookingTotal } from "@/lib/helpers/gst";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// PATCH /api/driver/ride/[token]/pricing - Public: set pricing via driver token
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { driverAccessToken: token },
    });
    if (!booking) return errorResponse("Ride not found", 404);

    const body = await request.json();
    const parsed = assignPricingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
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
      where: { id: booking.id },
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
        ...(parsed.data.actualDistance !== undefined && {
          actualDistance: parsed.data.actualDistance,
        }),
        ...(parsed.data.startKm !== undefined && { startKm: parsed.data.startKm }),
        ...(parsed.data.endKm !== undefined && { endKm: parsed.data.endKm }),
        ...(parsed.data.startDateTime !== undefined && { startDateTime: parsed.data.startDateTime }),
        ...(parsed.data.endDateTime !== undefined && { endDateTime: parsed.data.endDateTime }),
      },
    });

    logActivity({
      action: ActivityAction.BOOKING_PRICING_SET,
      description: `Pricing set via driver link for booking ${booking.bookingId}: total ${totals.totalAmount}`,
      userId: booking.driverId ?? undefined,
      entityType: "Booking",
      entityId: booking.id,
      metadata: {
        bookingId: booking.bookingId,
        totalAmount: totals.totalAmount,
        viaDriverLink: true,
      },
    }).catch(console.error);

    return successResponse(updated);
  } catch (error) {
    console.error("Driver ride pricing error:", error);
    return errorResponse("Failed to update pricing", 500);
  }
}
