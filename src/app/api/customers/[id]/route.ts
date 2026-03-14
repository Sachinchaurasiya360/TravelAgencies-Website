import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// GET /api/customers/[id] - Get customer detail (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { createdAt: "desc" },
          include: {
            payments: { select: { amount: true } },
          },
        },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!customer) return errorResponse("Customer not found", 404);

    // Calculate total spent aggregate
    const totalSpentResult = await prisma.payment.aggregate({
      where: { customerId: id },
      _sum: { amount: true },
    });

    return successResponse({
      ...customer,
      totalSpent: totalSpentResult._sum.amount || 0,
    });
  } catch (error) {
    console.error("Customer detail error:", error);
    return errorResponse("Failed to fetch customer", 500);
  }
}

// PATCH /api/customers/[id] - Update customer (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return errorResponse("Customer not found", 404);

    const allowedFields = [
      "name",
      "email",
      "phone",
      "alternatePhone",
      "address",
      "city",
      "state",
      "pincode",
      "gstin",
      "companyName",
      "notes",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid fields to update", 400);
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    logActivity({
      action: ActivityAction.CUSTOMER_UPDATED,
      description: `Customer ${updated.name} updated`,
      userId: session.user.id,
      entityType: "Customer",
      entityId: updated.id,
      metadata: { customerName: updated.name, updatedFields: Object.keys(updateData) },
    }).catch(console.error);

    return successResponse(updated);
  } catch (error) {
    console.error("Customer update error:", error);
    return errorResponse("Failed to update customer", 500);
  }
}
