import { format } from "date-fns";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Generate a booking ID atomically.
 * Uses simple sequential numbering: 1, 2, 3, ...
 * Should be called inside a transaction (tx) for atomicity.
 */
export async function generateBookingId(tx?: TxClient): Promise<string> {
  const db = tx || prisma;

  // Fetch all booking IDs to find the highest numeric one
  // (handles mix of old "TA-..." format and new numeric format)
  const allBookings = await db.booking.findMany({
    select: { bookingId: true },
  });

  let maxSeq = 0;
  for (const b of allBookings) {
    const parsed = parseInt(b.bookingId, 10);
    if (!isNaN(parsed) && parsed > maxSeq) {
      maxSeq = parsed;
    }
  }

  // If no numeric IDs exist yet, count total bookings so new IDs start after existing ones
  if (maxSeq === 0 && allBookings.length > 0) {
    maxSeq = allBookings.length;
  }

  return String(maxSeq + 1);
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
