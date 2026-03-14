import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, BookingStatus, PaymentStatus } from "@prisma/client";
import { requireAdmin, errorResponse } from "@/lib/api-helpers";
import {
  generateExcel,
  bookingsExportColumns,
  paymentsExportColumns,
} from "@/services/export.service";

// POST /api/reports/export - Export bookings or payments as Excel
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const { type, filters } = body as {
      type: "bookings" | "payments";
      filters?: {
        status?: string;
        fromDate?: string;
        toDate?: string;
        search?: string;
      };
    };

    if (!type || !["bookings", "payments"].includes(type)) {
      return errorResponse("Type must be 'bookings' or 'payments'", 400);
    }

    if (type === "bookings") {
      const where: Prisma.BookingWhereInput = {};

      if (filters?.status) {
        where.status = filters.status as BookingStatus;
      }
      if (filters?.fromDate) {
        where.travelDate = {
          ...(where.travelDate as Prisma.DateTimeFilter || {}),
          gte: new Date(filters.fromDate),
        };
      }
      if (filters?.toDate) {
        where.travelDate = {
          ...(where.travelDate as Prisma.DateTimeFilter || {}),
          lte: new Date(filters.toDate),
        };
      }
      if (filters?.search) {
        where.OR = [
          { bookingId: { contains: filters.search, mode: "insensitive" } },
          { customer: { name: { contains: filters.search, mode: "insensitive" } } },
          { customer: { phone: { contains: filters.search, mode: "insensitive" } } },
          { pickupLocation: { contains: filters.search, mode: "insensitive" } },
          { dropLocation: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const data = bookings.map((b) => ({
        bookingId: b.bookingId,
        customerName: b.customer.name,
        customerPhone: b.customer.phone,
        vehicleType: b.vehicleType,
        tripType: b.tripType,
        pickupLocation: b.pickupLocation,
        dropLocation: b.dropLocation,
        travelDate: b.travelDate.toLocaleDateString("en-IN"),
        status: b.status,
        baseFare: b.baseFare ? Number(b.baseFare) : 0,
        taxAmount: b.taxAmount ? Number(b.taxAmount) : 0,
        totalAmount: b.totalAmount ? Number(b.totalAmount) : 0,
        paymentStatus: b.paymentStatus,
      }));

      const buffer = await generateExcel(data, bookingsExportColumns(), "Bookings");

      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${type}-export-${Date.now()}.xlsx"`,
        },
      });
    }

    // type === "payments"
    const where: Prisma.PaymentWhereInput = {};

    if (filters?.status) {
      where.booking = {
        paymentStatus: filters.status as PaymentStatus,
      };
    }
    if (filters?.fromDate) {
      where.paymentDate = {
        ...(where.paymentDate as Prisma.DateTimeFilter || {}),
        gte: new Date(filters.fromDate),
      };
    }
    if (filters?.toDate) {
      where.paymentDate = {
        ...(where.paymentDate as Prisma.DateTimeFilter || {}),
        lte: new Date(filters.toDate),
      };
    }
    if (filters?.search) {
      where.OR = [
        { receiptNumber: { contains: filters.search, mode: "insensitive" } },
        { booking: { bookingId: { contains: filters.search, mode: "insensitive" } } },
        { customer: { name: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: { select: { bookingId: true } },
        customer: { select: { name: true } },
      },
      orderBy: { paymentDate: "desc" },
    });

    const data = payments.map((p) => ({
      receiptNumber: p.receiptNumber,
      bookingId: p.booking.bookingId,
      customerName: p.customer.name,
      amount: Number(p.amount),
      method: p.method,
      type: p.isAdvance ? "Advance" : "Payment",
      paymentDate: p.paymentDate.toLocaleDateString("en-IN"),
      transactionRef: p.transactionRef || "",
    }));

    const buffer = await generateExcel(data, paymentsExportColumns(), "Payments");

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}-export-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return errorResponse("Failed to generate export", 500);
  }
}
