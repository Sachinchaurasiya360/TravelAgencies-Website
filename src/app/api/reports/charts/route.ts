import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";

// GET /api/reports/charts?period=thisMonth|lastMonth|last3Months|thisYear|allTime
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "thisYear";

    // Calculate date range based on period
    const now = new Date();
    let fromDate: Date | null = null;
    let toDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (period) {
      case "thisMonth": {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      }
      case "lastMonth": {
        fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        toDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      }
      case "last3Months": {
        fromDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      }
      case "thisYear": {
        fromDate = new Date(now.getFullYear(), 0, 1);
        break;
      }
      case "allTime":
      default: {
        fromDate = null;
        break;
      }
    }

    // Build where clauses
    const paymentDateFilter: Prisma.PaymentWhereInput = fromDate
      ? { paymentDate: { gte: fromDate, lte: toDate } }
      : {};
    const bookingDateFilter: Prisma.BookingWhereInput = fromDate
      ? { createdAt: { gte: fromDate, lte: toDate } }
      : {};

    // Use raw SQL for monthly revenue grouping (much more efficient than loading all records)
    const monthlyRevenueRaw = fromDate
      ? await prisma.$queryRaw<{ month: string; revenue: number }[]>(
          Prisma.sql`
            SELECT TO_CHAR("paymentDate", 'YYYY-MM') as month,
                   COALESCE(SUM(amount), 0)::float as revenue
            FROM payments
            WHERE "paymentDate" >= ${fromDate} AND "paymentDate" <= ${toDate}
            GROUP BY TO_CHAR("paymentDate", 'YYYY-MM')
            ORDER BY month ASC
          `
        )
      : await prisma.$queryRaw<{ month: string; revenue: number }[]>(
          Prisma.sql`
            SELECT TO_CHAR("paymentDate", 'YYYY-MM') as month,
                   COALESCE(SUM(amount), 0)::float as revenue
            FROM payments
            GROUP BY TO_CHAR("paymentDate", 'YYYY-MM')
            ORDER BY month ASC
          `
        );

    const monthlyBookingsRaw = fromDate
      ? await prisma.$queryRaw<{ month: string; count: bigint }[]>(
          Prisma.sql`
            SELECT TO_CHAR("createdAt", 'YYYY-MM') as month,
                   COUNT(*)::bigint as count
            FROM bookings
            WHERE "createdAt" >= ${fromDate} AND "createdAt" <= ${toDate}
              AND status IN ('CONFIRMED', 'PENDING')
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
            ORDER BY month ASC
          `
        )
      : await prisma.$queryRaw<{ month: string; count: bigint }[]>(
          Prisma.sql`
            SELECT TO_CHAR("createdAt", 'YYYY-MM') as month,
                   COUNT(*)::bigint as count
            FROM bookings
            WHERE status IN ('CONFIRMED', 'PENDING')
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
            ORDER BY month ASC
          `
        );

    // Merge revenue and booking counts by month
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthMap = new Map<string, { revenue: number; bookings: number }>();
    for (const row of monthlyRevenueRaw) {
      monthMap.set(row.month, { revenue: Math.round(Number(row.revenue)), bookings: 0 });
    }
    for (const row of monthlyBookingsRaw) {
      const existing = monthMap.get(row.month) || { revenue: 0, bookings: 0 };
      existing.bookings = Number(row.count);
      monthMap.set(row.month, existing);
    }

    const monthlyRevenue = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => {
        const [year, month] = key.split("-");
        const monthIndex = parseInt(month, 10) - 1;
        return {
          month: `${monthNames[monthIndex]} ${year}`,
          revenue: data.revenue,
          bookings: data.bookings,
        };
      });

    // Status and vehicle breakdowns (already efficient with groupBy)
    const [statusGroups, vehicleGroups] = await Promise.all([
      prisma.booking.groupBy({
        by: ["status"],
        _count: true,
        where: bookingDateFilter,
      }),
      prisma.booking.groupBy({
        by: ["vehicleType"],
        _sum: { totalAmount: true },
        _count: true,
        where: {
          ...bookingDateFilter,
          status: "CONFIRMED",
          vehicleType: { not: null },
        },
      }),
    ]);

    const statusBreakdown = statusGroups.map((group) => ({
      status: group.status,
      count: group._count,
    }));

    const vehicleBreakdown = vehicleGroups.map((group) => ({
      vehicle: formatVehicleType(group.vehicleType),
      count: group._count,
      revenue: Math.round(Number(group._sum.totalAmount || 0)),
    }));

    return successResponse({
      monthlyRevenue,
      statusBreakdown,
      vehicleBreakdown,
      period,
    });
  } catch (error) {
    console.error("Charts data error:", error);
    return errorResponse("Failed to fetch chart data", 500);
  }
}

function formatVehicleType(type: string | null): string {
  if (!type) return "Unknown";
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
