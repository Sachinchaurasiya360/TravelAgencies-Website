import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminCreateBookingSchema } from "@/validators/booking.validator";
import { generateBookingId } from "@/lib/helpers/booking-id";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { BookingStatus, ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// POST /api/bookings/admin - Create booking (admin only)
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = adminCreateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;
    const cleanPhone = data.phone.replace(/^\+91/, "");

    // Upsert customer — also updates name/email if admin provides newer info
    const customer = await prisma.customer.upsert({
      where: { phone: cleanPhone },
      update: {
        name: data.name,
        ...(data.email ? { email: data.email } : {}),
      },
      create: {
        name: data.name,
        phone: cleanPhone,
        email: data.email || null,
      },
    });

    // Transaction for atomic booking ID generation + creation
    const booking = await prisma.$transaction(async (tx) => {
      const bookingId = await generateBookingId(tx);

      return tx.booking.create({
        data: {
          bookingId,
          customerId: customer.id,
          status: data.status as BookingStatus,
          travelDate: new Date(data.travelDate),
          returnDate: data.returnDate ? new Date(data.returnDate) : null,
          pickupLocation: data.pickupLocation,
          dropLocation: data.dropLocation,
          pickupTime: data.pickupTime || null,
          estimatedDistance: data.estimatedDistance ?? null,
          specialRequests: data.specialRequests || null,
          vehiclePreference: data.vehiclePreference || null,
          ...(data.status === "CONFIRMED" ? { confirmedAt: new Date() } : {}),
        },
      });
    });

    // Fire-and-forget logging
    logActivity({
      action: ActivityAction.BOOKING_CREATED,
      description: `Admin created booking ${booking.bookingId} for ${customer.name}`,
      userId: session.user?.id,
      entityType: "Booking",
      entityId: booking.id,
      metadata: { bookingId: booking.bookingId, createdByAdmin: true },
    }).catch(console.error);

    return successResponse(
      { id: booking.id, bookingId: booking.bookingId },
      201
    );
  } catch (error) {
    console.error("Admin booking creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create booking";
    return errorResponse(message, 500);
  }
}
