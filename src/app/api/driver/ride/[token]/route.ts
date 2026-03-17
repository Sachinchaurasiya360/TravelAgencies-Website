import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// GET /api/driver/ride/[token] - Public: fetch booking by driver access token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { driverAccessToken: token },
      select: {
        id: true,
        bookingId: true,
        status: true,
        travelDate: true,
        returnDate: true,
        pickupTime: true,
        pickupLocation: true,
        pickupAddress: true,
        dropLocation: true,
        dropAddress: true,
        estimatedDistance: true,
        specialRequests: true,
        customer: { select: { name: true, phone: true, email: true } },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleName: true,
            vehicleNumber: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        carSource: true,
        dutySlip: {
          select: {
            id: true,
            status: true,
            guestName: true,
            vehicleName: true,
            vehicleNumber: true,
            officeStartKm: true,
            officeStartDateTime: true,
            customerPickupKm: true,
            customerPickupDateTime: true,
            customerDropKm: true,
            customerDropDateTime: true,
            customerEndKm: true,
            customerEndDateTime: true,
            tollAmount: true,
            parkingAmount: true,
            otherChargeName: true,
            otherChargeAmount: true,
            signatureData: true,
            signedAt: true,
            submittedAt: true,
          },
        },
      },
    });

    if (!booking) return errorResponse("Ride not found", 404);

    return successResponse(booking);
  } catch (error) {
    console.error("Driver ride token error:", error);
    return errorResponse("Failed to fetch ride", 500);
  }
}
