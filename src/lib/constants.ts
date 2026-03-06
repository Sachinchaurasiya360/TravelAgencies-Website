export const GST_RATE = 5.0;
export const CGST_RATE = 2.5;
export const SGST_RATE = 2.5;
export const IGST_RATE = 5.0;
export const DEFAULT_SAC_CODE = "9964";
export const DEFAULT_PAYMENT_DUE_DAYS = 7;

export const BOOKING_PREFIX = "TA";
export const INVOICE_PREFIX = "INV";
export const RECEIPT_PREFIX = "RCT";
export const REFUND_PREFIX = "REF";

// Plain enum value arrays — safe for client components (no @prisma/client import)
export const BOOKING_STATUSES = [
  "PENDING", "CONFIRMED", "CANCELLED",
] as const;
export const PAYMENT_METHODS = ["CASH", "ONLINE"] as const;
export const REFUND_STATUSES = ["REQUESTED", "APPROVED", "PROCESSED", "REJECTED"] as const;

type BookingStatusValue = (typeof BOOKING_STATUSES)[number];

export const ALLOWED_STATUS_TRANSITIONS: Record<BookingStatusValue, BookingStatusValue[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  CANCELLED: [],
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  ONLINE: "Online",
};
