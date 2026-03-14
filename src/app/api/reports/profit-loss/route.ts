import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";

// GET /api/reports/profit-loss - Profit & Loss report (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const paymentWhere: Prisma.PaymentWhereInput = {};
    const refundWhere: Prisma.RefundWhereInput = {
      status: "PROCESSED",
    };

    if (fromDate || toDate) {
      paymentWhere.paymentDate = {};
      refundWhere.processedAt = {};
      if (fromDate) {
        paymentWhere.paymentDate.gte = new Date(fromDate);
        refundWhere.processedAt.gte = new Date(fromDate);
      }
      if (toDate) {
        paymentWhere.paymentDate.lte = new Date(toDate);
        refundWhere.processedAt.lte = new Date(toDate);
      }
    }

    // Total income (payments received)
    const incomeResult = await prisma.payment.aggregate({
      where: paymentWhere,
      _sum: { amount: true },
      _count: true,
    });

    // Total refunds processed
    const refundResult = await prisma.refund.aggregate({
      where: refundWhere,
      _sum: { refundedAmount: true, cancellationFee: true },
      _count: true,
    });

    // Tax collected from bookings in the period
    const bookingWhere: Prisma.BookingWhereInput = {
      status: "CONFIRMED",
    };
    if (fromDate || toDate) {
      bookingWhere.travelDate = {};
      if (fromDate) bookingWhere.travelDate.gte = new Date(fromDate);
      if (toDate) bookingWhere.travelDate.lte = new Date(toDate);
    }

    const taxResult = await prisma.booking.aggregate({
      where: bookingWhere,
      _sum: { taxAmount: true },
    });

    const totalIncome = Number(incomeResult._sum.amount || 0);
    const totalRefunds = Number(refundResult._sum.refundedAmount || 0);
    const cancellationFeeIncome = Number(refundResult._sum.cancellationFee || 0);
    const totalTaxCollected = Number(taxResult._sum.taxAmount || 0);

    const netRevenue = totalIncome - totalRefunds;
    const netRevenueAfterTax = netRevenue - totalTaxCollected;

    return successResponse({
      income: {
        totalPaymentsReceived: totalIncome,
        paymentCount: incomeResult._count,
        cancellationFeeIncome,
      },
      expenses: {
        totalRefunds,
        refundCount: refundResult._count,
        totalTaxLiability: totalTaxCollected,
      },
      summary: {
        netRevenue: Math.round(netRevenue),
        netRevenueAfterTax: Math.round(netRevenueAfterTax),
      },
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
    });
  } catch (error) {
    console.error("Profit-loss report error:", error);
    return errorResponse("Failed to generate profit & loss report", 500);
  }
}
