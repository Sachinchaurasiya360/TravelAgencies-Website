import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireAuth } from "@/lib/api-helpers";
import { generateDutySlipHtml } from "@/services/duty-slip-pdf.service";

// GET /api/duty-slips/[id]/pdf - Generate printable HTML duty slip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const [dutySlip, settings] = await Promise.all([
      prisma.dutySlip.findUnique({
        where: { id },
        include: {
          booking: {
            select: {
              id: true,
              bookingId: true,
              travelDate: true,
              pickupLocation: true,
              dropLocation: true,
              pickupTime: true,
              driverId: true,
              driver: { select: { name: true, phone: true, vehicleName: true, vehicleNumber: true } },
              vendor: { select: { name: true, phone: true } },
            },
          },
        },
      }),
      prisma.settings.findUnique({
        where: { id: "app_settings" },
        select: { companyName: true },
      }),
    ]);

    if (!dutySlip) return errorResponse("Duty slip not found", 404);

    // Driver can only view PDF for their own duty slip
    const role = (session.user as { role: string }).role;
    if (role === "DRIVER" && dutySlip.booking.driverId !== session.user.id) {
      return errorResponse("Access denied", 403);
    }

    const driver = dutySlip.booking.driver;
    const vendor = dutySlip.booking.vendor;

    const html = generateDutySlipHtml({
      bookingId: dutySlip.booking.bookingId,
      guestName: dutySlip.guestName,
      travelDate: dutySlip.booking.travelDate,
      pickupLocation: dutySlip.booking.pickupLocation,
      dropLocation: dutySlip.booking.dropLocation,
      pickupTime: dutySlip.booking.pickupTime,

      driverName: driver?.name ?? null,
      driverPhone: driver?.phone ?? null,
      vendorName: vendor?.name ?? null,
      vendorPhone: vendor?.phone ?? null,
      vehicleName: dutySlip.vehicleName ?? driver?.vehicleName ?? null,
      vehicleNumber: dutySlip.vehicleNumber ?? driver?.vehicleNumber ?? null,

      officeStartKm: dutySlip.officeStartKm,
      officeStartDateTime: dutySlip.officeStartDateTime,
      customerPickupKm: dutySlip.customerPickupKm,
      customerPickupDateTime: dutySlip.customerPickupDateTime,
      customerDropKm: dutySlip.customerDropKm,
      customerDropDateTime: dutySlip.customerDropDateTime,
      customerEndKm: dutySlip.customerEndKm,
      customerEndDateTime: dutySlip.customerEndDateTime,

      tollAmount: dutySlip.tollAmount?.toString() ?? null,
      parkingAmount: dutySlip.parkingAmount?.toString() ?? null,
      otherChargeName: dutySlip.otherChargeName,
      otherChargeAmount: dutySlip.otherChargeAmount?.toString() ?? null,

      signatureData: dutySlip.signatureData,
      submittedAt: dutySlip.submittedAt,

      companyName: settings?.companyName ?? "Sarthak Tour And Travels",
      status: dutySlip.status,
    });

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="duty-slip-${dutySlip.booking.bookingId}.html"`,
      },
    });
  } catch (error) {
    console.error("Duty slip PDF generation error:", error);
    return errorResponse("Failed to generate duty slip PDF", 500);
  }
}
