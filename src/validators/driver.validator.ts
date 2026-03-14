import { z } from "zod";

export const createDriverUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  email: z.string().email("Must be a valid email address"),
  phone: z
    .string()
    .min(10)
    .max(13)
    .regex(/^(\+91)?[6-9]\d{9}$/, "Must be a valid Indian mobile number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const updateDriverUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z
    .string()
    .min(10)
    .max(13)
    .regex(/^(\+91)?[6-9]\d{9}$/, "Must be a valid Indian mobile number")
    .optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

export const assignDriverSchema = z.object({
  driverId: z.string().min(1, "Driver ID is required").nullable(),
});
