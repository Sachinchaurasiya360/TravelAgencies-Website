import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const recordPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  invoiceId: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  method: z.nativeEnum(PaymentMethod, { message: "Please select a payment method" }),
  isAdvance: z.boolean().default(false),
  transactionRef: z.string().max(200).optional(),
  paymentDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
