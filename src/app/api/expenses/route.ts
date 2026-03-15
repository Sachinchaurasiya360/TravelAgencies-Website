import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, ActivityAction } from "@prisma/client";
import { createExpenseSchema } from "@/validators/expense.validator";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  getPaginationParams,
  paginationMeta,
  safeSortField,
  validEnumOrUndefined,
} from "@/lib/api-helpers";
import { logActivity } from "@/services/activity-log.service";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

const EXPENSE_SORT_FIELDS = ["createdAt", "expenseDate", "amount", "category"];

// GET /api/expenses - List expenses
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);

    const category = validEnumOrUndefined(searchParams.get("category"), EXPENSE_CATEGORIES);
    const search = searchParams.get("search");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: Prisma.ExpenseWhereInput = {};

    if (category) where.category = category as Prisma.EnumExpenseCategoryFilter;

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    if (fromDate || toDate) {
      where.expenseDate = {};
      if (fromDate) where.expenseDate.gte = new Date(fromDate);
      if (toDate) where.expenseDate.lte = new Date(toDate);
    }

    const [expenses, total, allTimeTotal] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { [safeSortField(sortBy, EXPENSE_SORT_FIELDS)]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);

    return successResponse({
      expenses,
      pagination: paginationMeta(total, page, limit),
      allTimeTotal: allTimeTotal._sum.amount?.toString() || "0",
    });
  } catch (error) {
    console.error("Expenses list error:", error);
    return errorResponse("Failed to fetch expenses", 500);
  }
}

// POST /api/expenses - Create expense
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;

    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        description: data.description,
        amount: data.amount,
        expenseDate: data.expenseDate || new Date(),
        notes: data.notes || null,
        createdById: session.user.id,
      },
    });

    logActivity({
      action: ActivityAction.EXPENSE_CREATED,
      description: `Expense created: ${data.description} - ${data.amount}`,
      userId: session.user.id,
      entityType: "Expense",
      entityId: expense.id,
      metadata: { category: data.category, amount: data.amount },
    }).catch(console.error);

    return successResponse(expense, 201);
  } catch (error) {
    console.error("Expense creation error:", error);
    return errorResponse("Failed to create expense", 500);
  }
}
