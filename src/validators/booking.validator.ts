import { z } from "zod";
import { BOOKING_STATUSES } from "@/lib/constants";

export const createBookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  phone: z
    .string()
    .min(10)
    .max(13)
    .regex(/^(\+91)?[6-9]\d{9}$/, "Must be a valid Indian mobile number"),
  email: z.string().email().optional().or(z.literal("")),
  travelDate: z.coerce
    .date({ message: "Travel date is required" })
    .refine((d) => d > new Date(), "Travel date must be in the future"),
  pickupLocation: z.string().min(2, "Pickup location is required").max(500).trim(),
  dropLocation: z.string().min(2, "Drop location is required").max(500).trim(),
  pickupTime: z.string().max(20).optional(),
});

export const assignPricingSchema = z.object({
  baseFare: z.number().positive("Base fare must be positive").max(10000000),
  tollCharges: z.number().min(0).default(0),
  driverAllowance: z.number().min(0).default(0),
  extraCharges: z.number().min(0).default(0),
  extraChargesNote: z.string().max(500).optional(),
  discount: z.number().min(0).default(0),
  includeGst: z.boolean().default(false),
  paymentDueDate: z.coerce.date().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES, { message: "Invalid status" }),
  reason: z.string().max(1000).optional(),
});

export const trackBookingSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  phone: z
    .string()
    .min(10)
    .max(13)
    .regex(/^(\+91)?[6-9]\d{9}$/, "Must be a valid Indian mobile number"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type AssignPricingInput = z.infer<typeof assignPricingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type TrackBookingInput = z.infer<typeof trackBookingSchema>;
