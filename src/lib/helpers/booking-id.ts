import { format } from "date-fns";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Generate a booking ID atomically.
 * Uses date-prefixed sequential numbering: TA-20260315-0001
 * Should be called inside a transaction (tx) for atomicity.
 */
export async function generateBookingId(tx?: TxClient): Promise<string> {
  const db = tx || prisma;
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `TA-${today}-`;

  const lastBooking = await db.booking.findFirst({
    where: { bookingId: { startsWith: prefix } },
    orderBy: { bookingId: "desc" },
    select: { bookingId: true },
  });

  let seq = 1;
  if (lastBooking) {
    seq = parseInt(lastBooking.bookingId.split("-").pop() || "0", 10) + 1;
  }

  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

/** Generate an invoice number. Should be called inside a transaction. */
export async function generateInvoiceNumber(tx?: TxClient): Promise<string> {
  const db = tx || prisma;
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `INV-${today}-`;

  const lastInvoice = await db.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let sequence = 1;
  if (lastInvoice) {
    sequence = parseInt(lastInvoice.invoiceNumber.split("-").pop() || "0", 10) + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

/** Generate a receipt number. Should be called inside a transaction. */
export async function generateReceiptNumber(tx?: TxClient): Promise<string> {
  const db = tx || prisma;
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `RCT-${today}-`;

  const lastPayment = await db.payment.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });

  let sequence = 1;
  if (lastPayment) {
    sequence = parseInt(lastPayment.receiptNumber.split("-").pop() || "0", 10) + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

/** Generate a refund number. Should be called inside a transaction. */
export async function generateRefundNumber(tx?: TxClient): Promise<string> {
  const db = tx || prisma;
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `REF-${today}-`;

  const lastRefund = await db.refund.findFirst({
    where: { refundNumber: { startsWith: prefix } },
    orderBy: { refundNumber: "desc" },
    select: { refundNumber: true },
  });

  let sequence = 1;
  if (lastRefund) {
    sequence = parseInt(lastRefund.refundNumber.split("-").pop() || "0", 10) + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}
