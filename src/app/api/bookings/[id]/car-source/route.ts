import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";
import { z } from "zod";

const carSourceSchema = z.object({
  carSource: z.enum(["OWN_CAR", "VENDOR_CAR"]),
  vendorId: z.string().nullable().optional(),
  vendorCost: z.number().min(0).nullable().optional(),
});

// PATCH /api/bookings/[id]/car-source - Set car source and vendor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = carSourceSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, bookingId: true },
    });
    if (!booking) return errorResponse("Booking not found", 404);

    const { carSource, vendorId, vendorCost } = parsed.data;

    if (carSource === "VENDOR_CAR") {
      if (!vendorId) {
        return errorResponse("Vendor is required for vendor car", 400);
      }
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
      });
      if (!vendor) return errorResponse("Vendor not found", 404);
      if (!vendor.isActive) return errorResponse("Vendor is inactive", 400);

      await prisma.booking.update({
        where: { id },
        data: {
          carSource: "VENDOR_CAR",
          vendorId,
          vendorCost: vendorCost ?? null,
        },
      });

      logActivity({
        action: ActivityAction.BOOKING_UPDATED,
        description: `Car source set to Vendor (${vendor.name}) for booking ${booking.bookingId}`,
        userId: session.user.id,
        entityType: "Booking",
        entityId: booking.id,
        metadata: {
          bookingId: booking.bookingId,
          carSource: "VENDOR_CAR",
          vendorName: vendor.name,
          vendorCost,
        },
      }).catch(console.error);
    } else {
      await prisma.booking.update({
        where: { id },
        data: {
          carSource: "OWN_CAR",
          vendorId: null,
          vendorCost: null,
        },
      });

      logActivity({
        action: ActivityAction.BOOKING_UPDATED,
        description: `Car source set to Own Car for booking ${booking.bookingId}`,
        userId: session.user.id,
        entityType: "Booking",
        entityId: booking.id,
        metadata: { bookingId: booking.bookingId, carSource: "OWN_CAR" },
      }).catch(console.error);
    }

    return successResponse({ updated: true });
  } catch (error) {
    console.error("Car source error:", error);
    return errorResponse("Failed to update car source", 500);
  }
}
