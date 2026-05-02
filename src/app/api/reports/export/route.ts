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
    const { type, filters, columns } = body as {
      type: "bookings" | "payments";
      filters?: {
        status?: string;
        fromDate?: string;
        toDate?: string;
        search?: string;
      };
      columns?: string[];
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
        const toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 999);
        where.travelDate = {
          ...(where.travelDate as Prisma.DateTimeFilter || {}),
          lte: toDate,
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
          customer: { select: { name: true, phone: true, email: true } },
          driver: { select: { name: true } },
          vendor: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const formatDate = (value: Date | null) => value ? value.toLocaleDateString("en-IN") : "";
      const formatDateTime = (value: Date | null) => value ? value.toLocaleString("en-IN") : "";
      const data = bookings.map((b) => ({
        bookingId: b.bookingId,
        customerName: b.customer.name,
        customerPhone: b.customer.phone,
        customerEmail: b.customer.email || "",
        pickupLocation: b.pickupLocation,
        pickupAddress: b.pickupAddress || "",
        dropLocation: b.dropLocation,
        dropAddress: b.dropAddress || "",
        travelDate: formatDate(b.travelDate),
        returnDate: formatDate(b.returnDate),
        pickupTime: b.pickupTime || "",
        vehiclePreference: b.vehiclePreference || "",
        carSource: b.carSource,
        driverName: b.driver?.name || "",
        vendorName: b.vendor?.name || "",
        status: b.status,
        baseFare: b.baseFare ? Number(b.baseFare) : 0,
        tollCharges: b.tollCharges ? Number(b.tollCharges) : 0,
        parkingCharges: b.parkingCharges ? Number(b.parkingCharges) : 0,
        driverAllowance: b.driverAllowance ? Number(b.driverAllowance) : 0,
        extraCharges: b.extraCharges ? Number(b.extraCharges) : 0,
        discount: b.discount ? Number(b.discount) : 0,
        totalAmount: b.totalAmount ? Number(b.totalAmount) : 0,
        advanceAmount: b.advanceAmount ? Number(b.advanceAmount) : 0,
        paymentStatus: b.paymentStatus,
        specialRequests: b.specialRequests || "",
        adminRemarks: b.adminRemarks || "",
        createdAt: formatDateTime(b.createdAt),
      }));

      const allColumns = bookingsExportColumns();
      const selectedKeys = new Set(columns?.length ? columns : allColumns.map((col) => col.key));
      const exportColumns = allColumns.filter((col) => selectedKeys.has(col.key));
      if (exportColumns.length === 0) return errorResponse("Select at least one column", 400);

      const selectedData = data.map((row: Record<string, unknown>) =>
        Object.fromEntries(exportColumns.map((col) => [col.key, row[col.key]]))
      );

      const settings = await prisma.settings.findUnique({ where: { id: "app_settings" } });
      const period = filters?.fromDate || filters?.toDate
        ? `${filters?.fromDate || "Start"} to ${filters?.toDate || "Today"}`
        : "All Dates";

      const buffer = await generateExcel(selectedData, exportColumns, "Bookings", {
        title: "Bookings Export",
        period,
        generatedAt: new Date(),
        companyName: settings?.companyName || undefined,
        companyPhone: settings?.companyPhone ? `Mob No ${settings.companyPhone}` : undefined,
      });

      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="bookings-${period.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "all-dates"}.xlsx"`,
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
