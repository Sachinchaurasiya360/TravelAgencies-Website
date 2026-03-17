import { z } from "zod";

export const createVendorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200).trim(),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(13)
    .regex(/^(\+91)?[6-9]\d{9}$/, "Must be a valid Indian mobile number"),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  vehicles: z.string().max(2000).optional(), // Free-text description of vehicles
  rateInfo: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  phone: z
    .string()
    .min(10)
    .max(13)
    .regex(/^(\+91)?[6-9]\d{9}$/, "Must be a valid Indian mobile number")
    .optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  vehicles: z.string().max(2000).optional(),
  rateInfo: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
