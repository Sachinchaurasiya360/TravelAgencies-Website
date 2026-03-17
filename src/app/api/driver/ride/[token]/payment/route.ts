import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, ActivityAction } from "@prisma/client";
import { recordPaymentSchema } from "@/validators/payment.validator";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { logActivity } from "@/services/activity-log.service";

// POST /api/driver/ride/[token]/payment - Public: record payment via driver token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { driverAccessToken: token },
      include: { customer: true },
    });
    if (!booking) return errorResponse("Ride not found", 404);

    const body = await request.json();
    // Override bookingId from the token-resolved booking
    const parsed = recordPaymentSchema.safeParse({
      ...body,
      bookingId: booking.id,
    });
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;

    if (data.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
      });
      if (!invoice) return errorResponse("Invoice not found", 404);
      if (invoice.bookingId !== booking.id) {
        return errorResponse("Invoice does not belong to this booking", 400);
      }
    }

    const payment = await prisma.$transaction(async (tx) => {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const prefix = `RCT-${today}-`;
      const lastPayment = await tx.payment.findFirst({
        where: { receiptNumber: { startsWith: prefix } },
        orderBy: { receiptNumber: "desc" },
        select: { receiptNumber: true },
      });
      let seq = 1;
      if (lastPayment) {
        seq =
          parseInt(lastPayment.receiptNumber.split("-").pop() || "0", 10) + 1;
      }
      const receiptNumber = `${prefix}${seq.toString().padStart(4, "0")}`;

      const newPayment = await tx.payment.create({
        data: {
          receiptNumber,
          bookingId: booking.id,
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

      const totalPaidResult = await tx.payment.aggregate({
        where: { bookingId: booking.id },
        _sum: { amount: true },
      });

      const totalPaid = Number(totalPaidResult._sum.amount || 0);
      const totalAmount = Number(booking.totalAmount || 0);

      let newPaymentStatus: PaymentStatus;
      if (totalAmount <= 0 || totalPaid >= totalAmount) {
        newPaymentStatus = PaymentStatus.PAID;
      } else if (totalPaid > 0) {
        newPaymentStatus = PaymentStatus.PARTIAL;
      } else {
        newPaymentStatus = PaymentStatus.PENDING;
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: newPaymentStatus,
          ...(data.isAdvance
            ? { advanceAmount: data.amount, advancePaidAt: new Date() }
            : {}),
        },
      });

      if (data.invoiceId) {
        const [invoicePaidResult, invoice] = await Promise.all([
          tx.payment.aggregate({
            where: { invoiceId: data.invoiceId },
            _sum: { amount: true },
          }),
          tx.invoice.findUnique({
            where: { id: data.invoiceId },
            select: { grandTotal: true },
          }),
        ]);

        const invoicePaid = Number(invoicePaidResult._sum.amount || 0);
        const invoiceTotal = Number(invoice?.grandTotal || 0);
        const balanceDue = Math.max(0, invoiceTotal - invoicePaid);

        await tx.invoice.update({
          where: { id: data.invoiceId },
          data: {
            amountPaid: Math.round(invoicePaid),
            balanceDue: Math.round(balanceDue),
            status:
              balanceDue <= 0
                ? "PAID"
                : invoicePaid > 0
                  ? "PARTIALLY_PAID"
                  : undefined,
          },
        });
      }

      return newPayment;
    });

    logActivity({
      action: ActivityAction.PAYMENT_RECORDED,
      description: `Payment ${payment.receiptNumber} recorded via driver link for booking ${booking.bookingId}: ${data.amount}`,
      userId: booking.driverId ?? undefined,
      entityType: "Payment",
      entityId: payment.id,
      metadata: {
        receiptNumber: payment.receiptNumber,
        bookingId: booking.bookingId,
        amount: data.amount,
        viaDriverLink: true,
      },
    }).catch(console.error);

    return successResponse(payment, 201);
  } catch (error) {
    console.error("Driver ride payment error:", error);
    return errorResponse("Failed to record payment", 500);
  }
}
