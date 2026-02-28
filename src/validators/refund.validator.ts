import { z } from "zod";
import { REFUND_STATUSES, PAYMENT_METHODS } from "@/lib/constants";

export const createRefundSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  requestedAmount: z.number().positive("Amount must be positive"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(2000),
});

export const processRefundSchema = z.object({
  status: z.enum(REFUND_STATUSES, { message: "Invalid refund status" }),
  approvedAmount: z.number().min(0).optional(),
  cancellationFee: z.number().min(0).optional(),
  refundMethod: z.enum(PAYMENT_METHODS).optional(),
  transactionRef: z.string().max(200).optional(),
  adminRemarks: z.string().max(2000).optional(),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type ProcessRefundInput = z.infer<typeof processRefundSchema>;
