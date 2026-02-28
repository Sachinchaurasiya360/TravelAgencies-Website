import { z } from "zod";

export const createInvoiceSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  dueDate: z.coerce.date().optional(),
  serviceDescription: z.string().max(1000).optional(),
  termsAndConditions: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional(),
  isInterState: z.boolean().default(false),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
