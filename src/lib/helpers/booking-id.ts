import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function generateBookingId(): Promise<string> {
  const count = await prisma.booking.count();
  return String(count + 1);
}

export async function generateInvoiceNumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `INV-${today}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split("-").pop() || "0", 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

export async function generateReceiptNumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `RCT-${today}-`;

  const lastPayment = await prisma.payment.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });

  let sequence = 1;
  if (lastPayment) {
    const lastSequence = parseInt(lastPayment.receiptNumber.split("-").pop() || "0", 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

export async function generateRefundNumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `REF-${today}-`;

  const lastRefund = await prisma.refund.findFirst({
    where: { refundNumber: { startsWith: prefix } },
    orderBy: { refundNumber: "desc" },
    select: { refundNumber: true },
  });

  let sequence = 1;
  if (lastRefund) {
    const lastSequence = parseInt(lastRefund.refundNumber.split("-").pop() || "0", 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}
