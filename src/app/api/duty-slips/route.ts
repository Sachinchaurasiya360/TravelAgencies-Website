import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, DutySlipStatus } from "@prisma/client";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  getPaginationParams,
  paginationMeta,
  safeSortField,
  validEnumOrUndefined,
} from "@/lib/api-helpers";

const SORT_FIELDS = ["createdAt", "submittedAt", "guestName"];
const VALID_STATUSES = ["PENDING", "SUBMITTED"];

// GET /api/duty-slips - List all duty slips (admin)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);

    const status = validEnumOrUndefined(searchParams.get("status"), VALID_STATUSES);
    const search = searchParams.get("search");

    const where: Prisma.DutySlipWhereInput = {};

    if (status) where.status = status as DutySlipStatus;

    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: "insensitive" } },
        { vehicleName: { contains: search, mode: "insensitive" } },
        { vehicleNumber: { contains: search, mode: "insensitive" } },
        { booking: { bookingId: { contains: search, mode: "insensitive" } } },
        { driver: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [dutySlips, total] = await Promise.all([
      prisma.dutySlip.findMany({
        where,
        include: {
          booking: { select: { id: true, bookingId: true, travelDate: true } },
          driver: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { [safeSortField(sortBy, SORT_FIELDS)]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.dutySlip.count({ where }),
    ]);

    return successResponse({
      dutySlips,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Duty slips list error:", error);
    return errorResponse("Failed to fetch duty slips", 500);
  }
}
