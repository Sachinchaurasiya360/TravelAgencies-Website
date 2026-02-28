import { z } from "zod";

export const updateSettingsSchema = z
  .object({
    companyName: z.string().min(1).max(200),
    companyLegalName: z.string().max(200),
    companyAddress: z.string().max(500),
    companyCity: z.string().max(100),
    companyState: z.string().max(100),
    companyStateCode: z.string().max(5),
    companyPincode: z.string().max(10),
    companyPhone: z.string().max(20),
    companyEmail: z.string().email(),
    companyWebsite: z.string().max(200),
    companyGstin: z
      .string()
      .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
      .or(z.literal("")),
    companyPan: z.string().max(10),
    companyCin: z.string().max(25),
    gstRate: z.number().min(0).max(100),
    defaultSacCode: z.string().max(10),
    isInterState: z.boolean(),
    bankName: z.string().max(200),
    bankBranch: z.string().max(200),
    bankAccountNumber: z.string().max(30),
    bankIfscCode: z.string().max(15),
    bankAccountName: z.string().max(200),
    upiId: z.string().max(100),
    smsEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    whatsappEnabled: z.boolean(),
    invoicePrefix: z.string().max(10),
    invoiceTerms: z.string().max(5000),
    invoiceNotes: z.string().max(2000),
    bookingPrefix: z.string().max(10),
    autoApprove: z.boolean(),
    defaultPaymentDueDays: z.number().int().min(1).max(365),
  })
  .partial();

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
