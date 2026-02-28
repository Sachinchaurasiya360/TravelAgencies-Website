import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAuth,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";

// GET /api/reports/outstanding - Outstanding dues report (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = getPaginationParams(searchParams);

    // Find bookings with outstanding payments (PENDING, PARTIAL, or OVERDUE)
    const where = {
      paymentStatus: { in: ["PENDING" as const, "PARTIAL" as const, "OVERDUE" as const] },
      totalAmount: { not: null },
      status: { notIn: ["CANCELLED" as const, "REJECTED" as const] },
    };

    const [bookings, total] = await Promise.all([
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
    ]);

    // Calculate outstanding for each booking
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

    // Summary aggregates
    const totalOutstanding = outstandingBookings.reduce(
      (sum, b) => sum + b.outstanding,
      0
    );
    const overdueCount = outstandingBookings.filter((b) => b.isOverdue).length;
    const overdueAmount = outstandingBookings
      .filter((b) => b.isOverdue)
      .reduce((sum, b) => sum + b.outstanding, 0);

    return successResponse({
      summary: {
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        totalBookings: total,
        overdueCount,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
      },
      bookings: outstandingBookings,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Outstanding report error:", error);
    return errorResponse("Failed to generate outstanding report", 500);
  }
}
