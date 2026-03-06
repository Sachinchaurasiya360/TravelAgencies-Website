import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-helpers";

// GET /api/reports/summary - Dashboard summary for reports page
export async function GET() {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const [
      totalRevenueAgg,
      totalExpensesAgg,
      outstandingAgg,
      totalBookings,
      confirmedBookings,
    ] = await Promise.all([
      // Total revenue from payments received
      prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      // Total expenses (toll + driver allowance + extra charges from confirmed bookings)
      prisma.booking.aggregate({
        _sum: {
          tollCharges: true,
          driverAllowance: true,
          extraCharges: true,
        },
        where: { status: "CONFIRMED" },
      }),
      // Outstanding dues (total amount - paid amount for confirmed bookings)
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "CONFIRMED",
          paymentStatus: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
          totalAmount: { not: null },
        },
      }),
      // Total bookings count
      prisma.booking.count(),
      // Confirmed bookings count
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
    ]);

    const totalRevenue = totalRevenueAgg._sum.amount?.toString() || "0";
    const expenses =
      (Number(totalExpensesAgg._sum.tollCharges || 0) +
        Number(totalExpensesAgg._sum.driverAllowance || 0) +
        Number(totalExpensesAgg._sum.extraCharges || 0)).toString();
    const netProfit = (Number(totalRevenue) - Number(expenses)).toString();
    const outstandingDues = outstandingAgg._sum.totalAmount?.toString() || "0";

    return successResponse({
      totalRevenue,
      totalExpenses: expenses,
      netProfit,
      outstandingDues,
      totalBookings,
      completedBookings: confirmedBookings,
    });
  } catch (error) {
    console.error("Report summary error:", error);
    return errorResponse("Failed to fetch report summary", 500);
  }
}
