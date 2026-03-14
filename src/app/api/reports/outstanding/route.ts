import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";

// GET /api/reports/outstanding - Outstanding dues report (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = getPaginationParams(searchParams);

    // Find bookings with outstanding payments
    const where = {
      paymentStatus: { in: ["PENDING" as const, "PARTIAL" as const, "OVERDUE" as const] },
      totalAmount: { not: null },
      status: { notIn: ["CANCELLED" as const] },
    };

    const overdueWhere = {
      ...where,
      paymentDueDate: { lt: new Date() },
    };

    // Run paginated list + global summary aggregates in parallel
    const [bookings, total, globalTotalAgg, globalPaidAgg, overdueCount, overdueTotalAgg, overduePaidAgg] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          payments: {
            select: { amount: true, paymentDate: true },
            orderBy: { paymentDate: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
      // Global totals (across ALL pages, not just current page)
      prisma.booking.aggregate({ where, _sum: { totalAmount: true } }),
      prisma.payment.aggregate({ where: { booking: where }, _sum: { amount: true } }),
      // Overdue subset
      prisma.booking.count({ where: overdueWhere }),
      prisma.booking.aggregate({ where: overdueWhere, _sum: { totalAmount: true } }),
      prisma.payment.aggregate({ where: { booking: overdueWhere }, _sum: { amount: true } }),
    ]);

    const totalOutstanding = Math.max(0,
      Number(globalTotalAgg._sum.totalAmount || 0) - Number(globalPaidAgg._sum.amount || 0)
    );
    const overdueAmount = Math.max(0,
      Number(overdueTotalAgg._sum.totalAmount || 0) - Number(overduePaidAgg._sum.amount || 0)
    );

    // Per-row calculations for current page
    const outstandingBookings = bookings.map((booking) => {
      const totalPaid = booking.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const totalAmount = Number(booking.totalAmount || 0);
      const outstanding = Math.max(0, totalAmount - totalPaid);
      const lastPaymentDate = booking.payments[0]?.paymentDate || null;

      return {
        bookingId: booking.bookingId,
        id: booking.id,
        customer: booking.customer,
        totalAmount,
        totalPaid,
        outstanding,
        paymentStatus: booking.paymentStatus,
        travelDate: booking.travelDate,
        paymentDueDate: booking.paymentDueDate,
        lastPaymentDate,
        isOverdue: booking.paymentDueDate ? new Date() > booking.paymentDueDate : false,
      };
    });

    return successResponse({
      summary: {
        totalOutstanding: Math.round(totalOutstanding),
        totalBookings: total,
        overdueCount,
        overdueAmount: Math.round(overdueAmount),
      },
      bookings: outstandingBookings,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Outstanding report error:", error);
    return errorResponse("Failed to generate outstanding report", 500);
  }
}
