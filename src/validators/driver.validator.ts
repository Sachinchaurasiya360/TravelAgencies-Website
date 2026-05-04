import { z } from "zod";

export const createDriverUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  phone: z
    .string()
    .min(10)
    .max(13)
    .regex(/^(\+91)?[6-9]\d{9}$/, "Must be a valid Indian mobile number"),
  vehicleName: z.string().max(100).trim().optional(),
  vehicleNumber: z.string().max(20).trim().optional(),
  vendorId: z.string().min(1).optional().nullable(),
});

export const updateDriverUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z
    .string()
    .min(10)
    .max(13)
    .regex(/^(\+91)?[6-9]\d{9}$/, "Must be a valid Indian mobile number")
    .optional(),
  isActive: z.boolean().optional(),
  vehicleName: z.string().max(100).trim().optional(),
  vehicleNumber: z.string().max(20).trim().optional(),
  vendorId: z.string().min(1).optional().nullable(),
});

export const assignDriverSchema = z.object({
  driverId: z.string().min(1, "Driver ID is required").nullable(),
});
