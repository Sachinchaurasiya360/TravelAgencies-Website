import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";

// GET /api/reports/revenue - Revenue report (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const bookingWhere: Prisma.BookingWhereInput = {
      status: "CONFIRMED",
    };

    const paymentWhere: Prisma.PaymentWhereInput = {};

    if (fromDate || toDate) {
      bookingWhere.travelDate = {};
      paymentWhere.paymentDate = {};
      if (fromDate) {
        bookingWhere.travelDate.gte = new Date(fromDate);
        paymentWhere.paymentDate.gte = new Date(fromDate);
      }
      if (toDate) {
        bookingWhere.travelDate.lte = new Date(toDate);
        paymentWhere.paymentDate.lte = new Date(toDate);
      }
    }

    // Total revenue (sum of payments received)
    const revenueResult = await prisma.payment.aggregate({
      where: paymentWhere,
      _sum: { amount: true },
      _count: true,
    });

    const bookingResult = await prisma.booking.aggregate({
      where: bookingWhere,
      _sum: { totalAmount: true },
      _count: true,
    });

    return successResponse({
      summary: {
        totalRevenue: revenueResult._sum.amount || 0,
        totalPaymentsCount: revenueResult._count,
        totalBookingValue: bookingResult._sum.totalAmount || 0,
        bookingCount: bookingResult._count,
      },
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
    });
  } catch (error) {
    console.error("Revenue report error:", error);
    return errorResponse("Failed to generate revenue report", 500);
  }
}
