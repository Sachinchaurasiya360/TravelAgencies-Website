import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAdmin,
} from "@/lib/api-helpers";
import { updateVendorSchema } from "@/validators/vendor.validator";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// GET /api/vendors/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!vendor) return errorResponse("Vendor not found", 404);
    return successResponse(vendor);
  } catch (error) {
    console.error("Vendor detail error:", error);
    return errorResponse("Failed to fetch vendor", 500);
  }
}

// PATCH /api/vendors/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateVendorSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) return errorResponse("Vendor not found", 404);

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.phone !== undefined)
      data.phone = parsed.data.phone.replace(/^\+91/, "");
    if (parsed.data.email !== undefined)
      data.email = parsed.data.email || null;
    if (parsed.data.address !== undefined)
      data.address = parsed.data.address || null;
    if (parsed.data.city !== undefined) data.city = parsed.data.city || null;
    if (parsed.data.state !== undefined)
      data.state = parsed.data.state || null;
    if (parsed.data.vehicles !== undefined)
      data.vehicles = parsed.data.vehicles || null;
    if (parsed.data.rateInfo !== undefined)
      data.rateInfo = parsed.data.rateInfo || null;
    if (parsed.data.notes !== undefined)
      data.notes = parsed.data.notes || null;
    if (parsed.data.isActive !== undefined)
      data.isActive = parsed.data.isActive;

    const updated = await prisma.vendor.update({ where: { id }, data });

    logActivity({
      action: ActivityAction.VENDOR_UPDATED,
      description: `Vendor "${updated.name}" updated`,
      userId: session.user.id,
      entityType: "Vendor",
      entityId: vendor.id,
    }).catch(console.error);

    return successResponse(updated);
  } catch (error) {
    console.error("Update vendor error:", error);
    return errorResponse("Failed to update vendor", 500);
  }
}

// DELETE /api/vendors/[id] - Soft delete (deactivate)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) return errorResponse("Vendor not found", 404);

    await prisma.vendor.update({
      where: { id },
      data: { isActive: false },
    });

    logActivity({
      action: ActivityAction.VENDOR_DELETED,
      description: `Vendor "${vendor.name}" deactivated`,
      userId: session.user.id,
      entityType: "Vendor",
      entityId: vendor.id,
    }).catch(console.error);

    return successResponse({ message: "Vendor deactivated" });
  } catch (error) {
    console.error("Delete vendor error:", error);
    return errorResponse("Failed to delete vendor", 500);
  }
}
