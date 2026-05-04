import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { assignDriverSchema } from "@/validators/driver.validator";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";
import { randomUUID } from "crypto";

// PATCH /api/bookings/[id]/assign-driver
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = assignDriverSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        bookingId: true,
        driverAccessToken: true,
        carSource: true,
        vendorId: true,
        customer: { select: { name: true } },
      },
    });
    if (!booking) return errorResponse("Booking not found", 404);

    const { driverId } = parsed.data;

    let driver = null;
    if (driverId) {
      driver = await prisma.user.findUnique({
        where: { id: driverId, role: "DRIVER" },
        select: { id: true, name: true, phone: true, isActive: true, vehicleName: true, vehicleNumber: true, vendorId: true },
      });
      if (!driver) return errorResponse("Driver not found", 404);
      if (!driver.isActive) return errorResponse("Driver is inactive", 400);
      if (booking.carSource === "VENDOR_CAR" && !booking.vendorId) {
        return errorResponse("Select a vendor before assigning a vendor driver", 400);
      }
      if (booking.carSource === "VENDOR_CAR" && booking.vendorId && driver.vendorId !== booking.vendorId) {
        return errorResponse("Driver is not linked to the selected vendor", 400);
      }
    }

    await prisma.booking.update({
      where: { id },
      data: {
        driverId,
        ...(!booking.driverAccessToken && driverId
          ? { driverAccessToken: randomUUID() }
          : {}),
      },
    });

    // Auto-create/update DutySlip when driver is assigned
    if (driverId && driver) {
      await prisma.dutySlip.upsert({
        where: { bookingId: id },
        create: {
          bookingId: id,
          driverId,
          guestName: booking.customer?.name || "Guest",
          vehicleName: driver.vehicleName,
          vehicleNumber: driver.vehicleNumber,
        },
        update: {
          driverId,
          guestName: booking.customer?.name || "Guest",
          vehicleName: driver.vehicleName,
          vehicleNumber: driver.vehicleNumber,
        },
      });

      logActivity({
        action: ActivityAction.DUTY_SLIP_CREATED,
        description: `Duty slip created for booking ${booking.bookingId}`,
        userId: session.user.id,
        entityType: "Booking",
        entityId: booking.id,
        metadata: { bookingId: booking.bookingId, driverName: driver.name },
      }).catch(console.error);
    }

    if (driver) {
      logActivity({
        action: ActivityAction.DRIVER_ASSIGNED,
        description: `Driver ${driver.name} assigned to booking ${booking.bookingId}`,
        userId: session.user.id,
        entityType: "Booking",
        entityId: booking.id,
        metadata: { bookingId: booking.bookingId, driverName: driver.name, driverPhone: driver.phone },
      }).catch(console.error);
    }

    return successResponse({ assigned: true });
  } catch (error) {
    console.error("Assign driver error:", error);
    return errorResponse("Failed to assign driver", 500);
  }
}
