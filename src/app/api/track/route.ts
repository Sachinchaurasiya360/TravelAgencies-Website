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
        driver: { select: { name: true, phone: true } },
        payments: {
          select: { amount: true, method: true, paymentDate: true, isAdvance: true },
          orderBy: { paymentDate: "desc" as const },
        },
        invoices: {
          select: { invoiceNumber: true, grandTotal: true, shareToken: true, signedAt: true },
          orderBy: { createdAt: "desc" as const },
          take: 1,
        },
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
      travelDate: booking.travelDate,
      returnDate: booking.returnDate,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
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
      driver: booking.driver ? { name: booking.driver.name, phone: booking.driver.phone } : null,
      payments: booking.payments.map(p => ({
        amount: p.amount?.toString(),
        method: p.method,
        paymentDate: p.paymentDate,
        isAdvance: p.isAdvance,
      })),
      invoices: booking.invoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        grandTotal: inv.grandTotal?.toString(),
        shareToken: inv.shareToken,
        signedAt: inv.signedAt,
      })),
      estimatedDistance: booking.estimatedDistance,
      actualDistance: booking.actualDistance,
      pickupTime: booking.pickupTime,
      baseFare: booking.baseFare?.toString() ?? null,
      tollCharges: booking.tollCharges?.toString() ?? null,
      parkingCharges: booking.parkingCharges?.toString() ?? null,
      driverAllowance: booking.driverAllowance?.toString() ?? null,
      extraCharges: booking.extraCharges?.toString() ?? null,
      extraChargesNote: booking.extraChargesNote,
      discount: booking.discount?.toString() ?? null,
    });
  } catch (error) {
    console.error("Track booking error:", error);
    return errorResponse("Failed to track booking", 500);
  }
}
