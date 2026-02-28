import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  successResponse,
  errorResponse,
  requireAuth,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";

// GET /api/customers - List all customers (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);
    const search = searchParams.get("search");

    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return successResponse({
      customers,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Customers list error:", error);
    return errorResponse("Failed to fetch customers", 500);
  }
}
