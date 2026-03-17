import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";

// GET /api/vendors/[id]/bookings - List bookings assigned to a vendor
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
      select: { id: true, name: true },
    });
    if (!vendor) return errorResponse("Vendor not found", 404);

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where = { vendorId: id };

    const [bookings, total, costResult] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          bookingId: true,
          status: true,
          travelDate: true,
          pickupLocation: true,
          dropLocation: true,
          vendorCost: true,
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
        _sum: { vendorCost: true },
      }),
    ]);

    return successResponse({
      bookings,
      summary: {
        totalTrips: total,
        totalVendorCost: costResult._sum.vendorCost || 0,
      },
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Vendor bookings error:", error);
    return errorResponse("Failed to fetch vendor bookings", 500);
  }
}
