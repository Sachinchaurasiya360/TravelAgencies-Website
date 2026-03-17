import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { updateDutySlipSchema, submitDutySlipSchema } from "@/validators/duty-slip.validator";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// Helper to find booking + duty slip by driver access token
async function getBookingAndSlip(token: string) {
  const booking = await prisma.booking.findUnique({
    where: { driverAccessToken: token },
    select: { id: true, bookingId: true, driverId: true },
  });
  if (!booking) return null;

  const dutySlip = await prisma.dutySlip.findUnique({
    where: { bookingId: booking.id },
  });
  return { booking, dutySlip };
}

// PATCH /api/driver/ride/[token]/duty-slip — Save draft
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const result = await getBookingAndSlip(token);
    if (!result || !result.dutySlip) return errorResponse("Duty slip not found", 404);

    const { dutySlip } = result;
    if (dutySlip.status === "SUBMITTED") {
      return errorResponse("Duty slip already submitted", 400);
    }

    const body = await request.json();
    const parsed = updateDutySlipSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data: Record<string, unknown> = {};
    const d = parsed.data;

    if (d.officeStartKm !== undefined) data.officeStartKm = d.officeStartKm;
    if (d.customerPickupKm !== undefined) data.customerPickupKm = d.customerPickupKm;
    if (d.customerPickupDateTime !== undefined) data.customerPickupDateTime = d.customerPickupDateTime || null;
    if (d.customerDropKm !== undefined) data.customerDropKm = d.customerDropKm;
    if (d.customerDropDateTime !== undefined) data.customerDropDateTime = d.customerDropDateTime || null;
    if (d.customerEndKm !== undefined) data.customerEndKm = d.customerEndKm;
    if (d.tollAmount !== undefined) data.tollAmount = d.tollAmount;
    if (d.parkingAmount !== undefined) data.parkingAmount = d.parkingAmount;
    if (d.otherChargeName !== undefined) data.otherChargeName = d.otherChargeName;
    if (d.otherChargeAmount !== undefined) data.otherChargeAmount = d.otherChargeAmount;

    const updated = await prisma.dutySlip.update({
      where: { id: dutySlip.id },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    console.error("Save duty slip draft error:", error);
    return errorResponse("Failed to save duty slip", 500);
  }
}

// POST /api/driver/ride/[token]/duty-slip — Submit with signature
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const result = await getBookingAndSlip(token);
    if (!result || !result.dutySlip) return errorResponse("Duty slip not found", 404);

    const { booking, dutySlip } = result;
    if (dutySlip.status === "SUBMITTED") {
      return errorResponse("Duty slip already submitted", 400);
    }

    const body = await request.json();
    const parsed = submitDutySlipSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data: Record<string, unknown> = {
      status: "SUBMITTED",
      signatureData: parsed.data.signatureData,
      signedAt: new Date(),
      submittedAt: new Date(),
    };

    const d = parsed.data;
    if (d.officeStartKm !== undefined) data.officeStartKm = d.officeStartKm;
    if (d.customerPickupKm !== undefined) data.customerPickupKm = d.customerPickupKm;
    if (d.customerPickupDateTime !== undefined) data.customerPickupDateTime = d.customerPickupDateTime || null;
    if (d.customerDropKm !== undefined) data.customerDropKm = d.customerDropKm;
    if (d.customerDropDateTime !== undefined) data.customerDropDateTime = d.customerDropDateTime || null;
    if (d.customerEndKm !== undefined) data.customerEndKm = d.customerEndKm;
    if (d.tollAmount !== undefined) data.tollAmount = d.tollAmount;
    if (d.parkingAmount !== undefined) data.parkingAmount = d.parkingAmount;
    if (d.otherChargeName !== undefined) data.otherChargeName = d.otherChargeName;
    if (d.otherChargeAmount !== undefined) data.otherChargeAmount = d.otherChargeAmount;

    const updated = await prisma.dutySlip.update({
      where: { id: dutySlip.id },
      data,
    });

    // Sync duty slip expenses to booking pricing fields
    const tollVal = d.tollAmount ?? Number(dutySlip.tollAmount ?? 0);
    const parkingVal = d.parkingAmount ?? Number(dutySlip.parkingAmount ?? 0);
    const otherVal = d.otherChargeAmount ?? Number(dutySlip.otherChargeAmount ?? 0);
    const otherName = d.otherChargeName ?? dutySlip.otherChargeName;

    const bookingUpdate: Record<string, unknown> = {};
    if (tollVal > 0) bookingUpdate.tollCharges = tollVal;
    if (parkingVal > 0) bookingUpdate.parkingCharges = parkingVal;
    if (otherVal > 0) {
      bookingUpdate.extraCharges = otherVal;
      if (otherName) bookingUpdate.extraChargesNote = otherName;
    }

    if (Object.keys(bookingUpdate).length > 0) {
      const currentBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        select: { baseFare: true, tollCharges: true, parkingCharges: true, driverAllowance: true, extraCharges: true, discount: true },
      });
      if (currentBooking?.baseFare) {
        const base = Number(currentBooking.baseFare);
        const toll = Number(bookingUpdate.tollCharges ?? currentBooking.tollCharges ?? 0);
        const parking = Number(bookingUpdate.parkingCharges ?? currentBooking.parkingCharges ?? 0);
        const allowance = Number(currentBooking.driverAllowance ?? 0);
        const extra = Number(bookingUpdate.extraCharges ?? currentBooking.extraCharges ?? 0);
        const discount = Number(currentBooking.discount ?? 0);
        bookingUpdate.totalAmount = Math.round(base + toll + parking + allowance + extra - discount);
      }
      await prisma.booking.update({ where: { id: booking.id }, data: bookingUpdate });
    }

    logActivity({
      action: ActivityAction.DUTY_SLIP_SUBMITTED,
      description: `Duty slip submitted for booking ${booking.bookingId}`,
      userId: booking.driverId || "",
      entityType: "Booking",
      entityId: booking.id,
      metadata: { bookingId: booking.bookingId },
    }).catch(console.error);

    return successResponse(updated);
  } catch (error) {
    console.error("Submit duty slip error:", error);
    return errorResponse("Failed to submit duty slip", 500);
  }
}
