import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";

// GET /api/drivers/[id]/bookings - List bookings assigned to a driver
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const driver = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!driver) return errorResponse("Driver not found", 404);

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where = { driverId: id };

    const [bookings, total, revenueResult] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          bookingId: true,
          status: true,
          travelDate: true,
          pickupLocation: true,
          dropLocation: true,
          totalAmount: true,
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { travelDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
      prisma.booking.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
    ]);

    return successResponse({
      bookings,
      summary: {
        totalTrips: total,
        totalRevenue: revenueResult._sum.totalAmount || 0,
      },
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Driver bookings error:", error);
    return errorResponse("Failed to fetch driver bookings", 500);
  }
}
