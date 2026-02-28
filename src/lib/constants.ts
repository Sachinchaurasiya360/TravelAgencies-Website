import { BookingStatus } from "@prisma/client";

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

export const ALLOWED_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.APPROVED, BookingStatus.REJECTED],
  [BookingStatus.APPROVED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.REJECTED]: [],
};

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  CAR_SEDAN: "Car - Sedan",
  CAR_SUV: "Car - SUV",
  CAR_HATCHBACK: "Car - Hatchback",
  CAR_LUXURY: "Car - Luxury",
  TEMPO_TRAVELLER: "Tempo Traveller",
  MINI_BUS: "Mini Bus",
  BUS: "Bus",
  OTHER: "Other",
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  REFUNDED: "Refunded",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
  CARD: "Card",
  OTHER: "Other",
};

export const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: "One Way",
  ROUND_TRIP: "Round Trip",
};
