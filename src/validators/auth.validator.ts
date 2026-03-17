import { z } from "zod";

export const otpRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const otpVerifySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  code: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
