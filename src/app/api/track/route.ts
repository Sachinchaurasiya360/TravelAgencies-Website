import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackBookingSchema } from "@/validators/booking.validator";
import { successResponse, errorResponse, getClientIp } from "@/lib/api-helpers";
import { publicTrackingLimit } from "@/lib/rate-limit";

// POST /api/track - Look up booking by ID + phone (public)
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = publicTrackingLimit(ip);
  if (!success) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }

  try {
    const body = await request.json();
    const parsed = trackBookingSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { bookingId, phone } = parsed.data;
    const cleanPhone = phone.replace(/^\+91/, "");

    const booking = await prisma.booking.findUnique({
      where: { bookingId },
      include: {
        customer: { select: { name: true, phone: true } },
      },
    });

    if (!booking || booking.customer.phone !== cleanPhone) {
      return errorResponse(
        "No booking found with this ID and phone number combination.",
        404
      );
    }

    // Return only safe data (no admin remarks, internal IDs, etc.)
    return successResponse({
      bookingId: booking.bookingId,
      status: booking.status,
      tripType: booking.tripType,
      vehicleType: booking.vehicleType,
      travelDate: booking.travelDate,
      returnDate: booking.returnDate,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      passengerCount: booking.passengerCount,
      totalAmount: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      approvedAt: booking.approvedAt,
      confirmedAt: booking.confirmedAt,
      startedAt: booking.startedAt,
      completedAt: booking.completedAt,
      cancelledAt: booking.cancelledAt,
      rejectionReason: booking.rejectionReason,
      cancellationReason: booking.cancellationReason,
    });
  } catch (error) {
    console.error("Track booking error:", error);
    return errorResponse("Failed to track booking", 500);
  }
}
