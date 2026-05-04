import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { updateDriverUserSchema } from "@/validators/driver.validator";

// GET /api/drivers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const driver = await prisma.user.findUnique({
      where: { id, role: "DRIVER" },
      select: {
        id: true,
        name: true,
        phone: true,
        vehicleName: true,
        vehicleNumber: true,
        vendorId: true,
        vendor: { select: { id: true, name: true, phone: true } },
        isActive: true,
        createdAt: true,
        _count: { select: { driverBookings: true } },
      },
    });
    if (!driver) return errorResponse("Driver not found", 404);
    return successResponse(driver);
  } catch (error) {
    console.error("Driver detail error:", error);
    return errorResponse("Failed to fetch driver", 500);
  }
}

// PATCH /api/drivers/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateDriverUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const driver = await prisma.user.findUnique({ where: { id, role: "DRIVER" } });
    if (!driver) return errorResponse("Driver not found", 404);
    if (parsed.data.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: parsed.data.vendorId },
        select: { id: true, isActive: true },
      });
      if (!vendor) return errorResponse("Vendor not found", 404);
      if (!vendor.isActive) return errorResponse("Vendor is inactive", 400);
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone.replace(/^\+91/, "");
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
    if (parsed.data.vehicleName !== undefined) data.vehicleName = parsed.data.vehicleName;
    if (parsed.data.vehicleNumber !== undefined) data.vehicleNumber = parsed.data.vehicleNumber;
    if (parsed.data.vendorId !== undefined) data.vendorId = parsed.data.vendorId || null;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        phone: true,
        vehicleName: true,
        vehicleNumber: true,
        vendorId: true,
        vendor: { select: { id: true, name: true, phone: true } },
        isActive: true,
        createdAt: true,
      },
    });
    return successResponse(updated);
  } catch (error) {
    console.error("Update driver error:", error);
    return errorResponse("Failed to update driver", 500);
  }
}

// DELETE /api/drivers/[id] - Always soft-delete (deactivate)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const driver = await prisma.user.findUnique({ where: { id, role: "DRIVER" } });
    if (!driver) return errorResponse("Driver not found", 404);

    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return successResponse({ message: "Driver deactivated" });
  } catch (error) {
    console.error("Delete driver error:", error);
    return errorResponse("Failed to delete driver", 500);
  }
}
