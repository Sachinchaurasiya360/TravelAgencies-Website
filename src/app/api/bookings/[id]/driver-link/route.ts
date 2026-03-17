import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";
import { randomUUID } from "crypto";

// POST /api/bookings/[id]/driver-link - Generate driver access link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, bookingId: true, driverAccessToken: true },
    });
    if (!booking) return errorResponse("Booking not found", 404);

    let token = booking.driverAccessToken;
    if (!token) {
      token = randomUUID();
      await prisma.booking.update({
        where: { id },
        data: { driverAccessToken: token },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const driverUrl = `${appUrl}/driver/ride/${token}`;

    logActivity({
      action: ActivityAction.DRIVER_LINK_GENERATED,
      description: `Driver link generated for booking ${booking.bookingId}`,
      userId: session.user.id,
      entityType: "Booking",
      entityId: booking.id,
    }).catch(console.error);

    return successResponse({ driverUrl, token });
  } catch (error) {
    console.error("Driver link error:", error);
    return errorResponse("Failed to generate driver link", 500);
  }
}
