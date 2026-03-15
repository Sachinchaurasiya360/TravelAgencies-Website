import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireDriver } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";

// GET /api/driver/bookings - List driver's bookings
export async function GET(request: NextRequest) {
  const session = await requireDriver();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const driverId = session.user.id;
    const type = request.nextUrl.searchParams.get("type") || "upcoming";
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const where: Prisma.BookingWhereInput = { driverId };

    if (type === "upcoming") {
      where.travelDate = { gte: now };
      where.status = { notIn: ["CANCELLED", "COMPLETED"] };
    } else {
      where.OR = [
        { travelDate: { lt: now }, status: { notIn: ["CANCELLED"] } },
        { status: { in: ["COMPLETED", "CANCELLED"] } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { travelDate: type === "upcoming" ? "asc" : "desc" },
      take: 50,
    });

    return successResponse({ bookings });
  } catch (error) {
    console.error("Driver bookings error:", error);
    return errorResponse("Failed to fetch bookings", 500);
  }
}
