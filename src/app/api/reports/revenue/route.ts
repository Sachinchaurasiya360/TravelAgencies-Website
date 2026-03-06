import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-helpers";

// GET /api/reports/revenue - Revenue report (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAuth();
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

    // Total tax from completed/active bookings
    const taxResult = await prisma.booking.aggregate({
      where: bookingWhere,
      _sum: { taxAmount: true, totalAmount: true },
      _count: true,
    });

    // Breakdown by vehicle type
    const vehicleBreakdown = await prisma.booking.groupBy({
      by: ["vehicleType"],
      where: bookingWhere,
      _sum: { totalAmount: true, taxAmount: true },
      _count: true,
      orderBy: { _count: { vehicleType: "desc" } },
    });

    return successResponse({
      summary: {
        totalRevenue: revenueResult._sum.amount || 0,
        totalPaymentsCount: revenueResult._count,
        totalBookingValue: taxResult._sum.totalAmount || 0,
        totalTax: taxResult._sum.taxAmount || 0,
        bookingCount: taxResult._count,
      },
      byVehicleType: vehicleBreakdown.map((item) => ({
        vehicleType: item.vehicleType,
        totalAmount: item._sum.totalAmount || 0,
        taxAmount: item._sum.taxAmount || 0,
        count: item._count,
      })),
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
