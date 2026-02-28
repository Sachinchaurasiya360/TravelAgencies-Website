import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// GET /api/bookings/[id] - Get single booking detail (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        invoices: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        refunds: { orderBy: { createdAt: "desc" } },
        notes: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        notifications: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!booking) return errorResponse("Booking not found", 404);

    return successResponse(booking);
  } catch (error) {
    console.error("Booking detail error:", error);
    return errorResponse("Failed to fetch booking", 500);
  }
}

// PATCH /api/bookings/[id] - Update booking fields (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return errorResponse("Booking not found", 404);

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        vehiclePreference: body.vehiclePreference,
        estimatedDistance: body.estimatedDistance,
        adminRemarks: body.adminRemarks,
      },
    });

    logActivity({
      action: ActivityAction.BOOKING_UPDATED,
      description: `Booking ${booking.bookingId} updated`,
      userId: session.user.id,
      entityType: "Booking",
      entityId: booking.id,
      metadata: { bookingId: booking.bookingId },
    }).catch(console.error);

    return successResponse(updated);
  } catch (error) {
    console.error("Booking update error:", error);
    return errorResponse("Failed to update booking", 500);
  }
}
