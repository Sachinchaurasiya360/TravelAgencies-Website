import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, PaymentStatus, ActivityAction } from "@prisma/client";
import { recordPaymentSchema } from "@/validators/payment.validator";
import { generateReceiptNumber } from "@/lib/helpers/booking-id";
import {
  successResponse,
  errorResponse,
  requireAuth,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";
import { logActivity } from "@/services/activity-log.service";

// GET /api/payments - List all payments (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);

    const bookingId = searchParams.get("bookingId");
    const customerId = searchParams.get("customerId");
    const method = searchParams.get("method");
    const search = searchParams.get("search");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: Prisma.PaymentWhereInput = {};

    if (bookingId) where.bookingId = bookingId;
    if (customerId) where.customerId = customerId;
    if (method) where.method = method as Prisma.EnumPaymentMethodFilter;

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search } } },
        { booking: { bookingId: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (fromDate || toDate) {
      where.paymentDate = {};
      if (fromDate) where.paymentDate.gte = new Date(fromDate);
      if (toDate) where.paymentDate.lte = new Date(toDate);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: { select: { bookingId: true, totalAmount: true } },
          customer: { select: { id: true, name: true, phone: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return successResponse({
      payments,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Payments list error:", error);
    return errorResponse("Failed to fetch payments", 500);
  }
}

// POST /api/payments - Record a payment (admin only)
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = recordPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { customer: true },
    });

    if (!booking) return errorResponse("Booking not found", 404);

    // Validate invoice if provided
    if (data.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
      });
      if (!invoice) return errorResponse("Invoice not found", 404);
      if (invoice.bookingId !== data.bookingId) {
        return errorResponse("Invoice does not belong to this booking", 400);
      }
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber();

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        receiptNumber,
        bookingId: data.bookingId,
        customerId: booking.customerId,
        invoiceId: data.invoiceId || null,
        amount: data.amount,
        method: data.method,
        isAdvance: data.isAdvance ?? false,
        transactionRef: data.transactionRef || null,
        paymentDate: data.paymentDate || new Date(),
        notes: data.notes || null,
      },
    });

    logActivity({
      action: ActivityAction.PAYMENT_RECORDED,
      description: `Payment ${payment.receiptNumber} recorded for booking ${booking.bookingId}: ${data.amount}`,
      userId: session.user.id,
      entityType: "Payment",
      entityId: payment.id,
      metadata: { receiptNumber: payment.receiptNumber, bookingId: booking.bookingId, amount: data.amount },
    }).catch(console.error);

    // Update booking payment status based on total paid vs totalAmount
    const totalPaidResult = await prisma.payment.aggregate({
      where: { bookingId: data.bookingId },
      _sum: { amount: true },
    });

    const totalPaid = Number(totalPaidResult._sum.amount || 0);
    const totalAmount = Number(booking.totalAmount || 0);

    let newPaymentStatus: PaymentStatus;
    if (totalAmount <= 0) {
      newPaymentStatus = PaymentStatus.PAID;
    } else if (totalPaid >= totalAmount) {
      newPaymentStatus = PaymentStatus.PAID;
    } else if (totalPaid > 0) {
      newPaymentStatus = PaymentStatus.PARTIAL;
    } else {
      newPaymentStatus = PaymentStatus.PENDING;
    }

    await prisma.booking.update({
      where: { id: data.bookingId },
      data: {
        paymentStatus: newPaymentStatus,
        ...(data.isAdvance
          ? { advanceAmount: data.amount, advancePaidAt: new Date() }
          : {}),
      },
    });

    // Update invoice amounts if invoiceId provided
    if (data.invoiceId) {
      const invoicePaidResult = await prisma.payment.aggregate({
        where: { invoiceId: data.invoiceId },
        _sum: { amount: true },
      });

      const invoicePaid = Number(invoicePaidResult._sum.amount || 0);

      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
        select: { grandTotal: true },
      });

      const invoiceTotal = Number(invoice?.grandTotal || 0);
      const balanceDue = Math.max(0, invoiceTotal - invoicePaid);

      await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
          amountPaid: invoicePaid,
          balanceDue: Math.round(balanceDue * 100) / 100,
          status: balanceDue <= 0 ? "PAID" : invoicePaid > 0 ? "PARTIALLY_PAID" : undefined,
        },
      });
    }

    return successResponse(payment, 201);
  } catch (error) {
    console.error("Payment recording error:", error);
    return errorResponse("Failed to record payment", 500);
  }
}
