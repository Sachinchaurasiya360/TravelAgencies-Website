import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { updateDutySlipSchema } from "@/validators/duty-slip.validator";

// PATCH /api/duty-slips/[id] — Admin edit duty slip KM & expenses
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const dutySlip = await prisma.dutySlip.findUnique({
      where: { id },
      include: { booking: { select: { id: true, bookingId: true } } },
    });

    if (!dutySlip) return errorResponse("Duty slip not found", 404);

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
      where: { id },
      data,
    });

    return successResponse(updated);
  } catch (error) {
    console.error("Admin edit duty slip error:", error);
    return errorResponse("Failed to update duty slip", 500);
  }
}
