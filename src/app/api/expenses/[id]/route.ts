import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ActivityAction, Prisma } from "@prisma/client";
import { updateExpenseSchema } from "@/validators/expense.validator";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { logActivity } from "@/services/activity-log.service";

// GET /api/expenses/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    if (!expense) return errorResponse("Expense not found", 404);

    return successResponse(expense);
  } catch (error) {
    console.error("Expense fetch error:", error);
    return errorResponse("Failed to fetch expense", 500);
  }
}

// PATCH /api/expenses/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return errorResponse("Expense not found", 404);

    const body = await request.json();
    const parsed = updateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data: Prisma.ExpenseUpdateInput = { ...parsed.data };
    if ("vehicleNumber" in data) data.vehicleNumber = data.vehicleNumber || null;
    if ("notes" in data) data.notes = data.notes || undefined;

    const expense = await prisma.expense.update({
      where: { id },
      data,
    });

    logActivity({
      action: ActivityAction.EXPENSE_UPDATED,
      description: `Expense updated: ${expense.description}`,
      userId: session.user.id,
      entityType: "Expense",
      entityId: expense.id,
    }).catch(console.error);

    return successResponse(expense);
  } catch (error) {
    console.error("Expense update error:", error);
    return errorResponse("Failed to update expense", 500);
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return errorResponse("Expense not found", 404);

    await prisma.expense.delete({ where: { id } });

    logActivity({
      action: ActivityAction.EXPENSE_DELETED,
      description: `Expense deleted: ${existing.description} - ${existing.amount}`,
      userId: session.user.id,
      entityType: "Expense",
      entityId: id,
    }).catch(console.error);

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("Expense delete error:", error);
    return errorResponse("Failed to delete expense", 500);
  }
}
