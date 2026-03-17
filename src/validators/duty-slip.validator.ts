import { z } from "zod";

export const updateDutySlipSchema = z.object({
  officeStartKm: z.number().min(0).optional(),
  customerPickupKm: z.number().min(0).optional(),
  customerPickupDateTime: z.string().optional(),
  customerDropKm: z.number().min(0).optional(),
  customerDropDateTime: z.string().optional(),
  customerEndKm: z.number().min(0).optional(),
  tollAmount: z.number().min(0).optional(),
  parkingAmount: z.number().min(0).optional(),
  otherChargeName: z.string().max(100).trim().optional(),
  otherChargeAmount: z.number().min(0).optional(),
});

export const submitDutySlipSchema = updateDutySlipSchema.extend({
  signatureData: z.string().min(1, "Signature is required"),
});
