import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(13, "Phone number is too long")
  .regex(/^(\+91)?[6-9]\d{9}$/, "Must be a valid Indian mobile number");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const dateRangeSchema = z
  .object({
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.fromDate && data.toDate) return data.fromDate <= data.toDate;
      return true;
    },
    { message: "Start date must be before end date" }
  );

export const gstinSchema = z
  .string()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    "Must be a valid GSTIN"
  )
  .optional()
  .or(z.literal(""));

export const emailSchema = z
  .string()
  .email("Must be a valid email address")
  .optional()
  .or(z.literal(""));
