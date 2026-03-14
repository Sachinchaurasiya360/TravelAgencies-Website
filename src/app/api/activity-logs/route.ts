import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, ActivityAction } from "@prisma/client";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";

// GET /api/activity-logs - List activity logs (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);

    const action = searchParams.get("action") as ActivityAction | null;
    const userId = searchParams.get("userId");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const search = searchParams.get("search");

    const where: Prisma.ActivityLogWhereInput = {};

    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return successResponse({
      logs,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Activity logs list error:", error);
    return errorResponse("Failed to fetch activity logs", 500);
  }
}
