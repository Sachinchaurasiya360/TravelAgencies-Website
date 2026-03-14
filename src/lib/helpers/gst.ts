import { CGST_RATE, SGST_RATE, IGST_RATE } from "@/lib/constants";

export interface GstCalculation {
  subtotal: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

export function calculateGst(subtotal: number, isInterState: boolean): GstCalculation {
  if (isInterState) {
    const igstAmount = Math.round((subtotal * IGST_RATE) / 100);
    return {
      subtotal,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: IGST_RATE,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount,
      totalTax: igstAmount,
    };
  }

  const cgstAmount = Math.round((subtotal * CGST_RATE) / 100);
  const sgstAmount = Math.round((subtotal * SGST_RATE) / 100);

  return {
    subtotal,
    cgstRate: CGST_RATE,
    sgstRate: SGST_RATE,
    igstRate: 0,
    cgstAmount,
    sgstAmount,
    igstAmount: 0,
    totalTax: cgstAmount + sgstAmount,
  };
}

export function calculateBookingTotal(params: {
  baseFare: number;
  tollCharges?: number;
  parkingCharges?: number;
  driverAllowance?: number;
  extraCharges?: number;
  discount?: number;
  isInterState?: boolean;
  includeGst?: boolean;
}): {
  baseFare: number;
  taxAmount: number;
  tollCharges: number;
  parkingCharges: number;
  driverAllowance: number;
  extraCharges: number;
  discount: number;
  totalAmount: number;
} {
  const { baseFare, tollCharges = 0, parkingCharges = 0, driverAllowance = 0, extraCharges = 0, discount = 0 } = params;
  const includeGst = params.includeGst ?? true;
  const taxAmount = includeGst
    ? calculateGst(baseFare, params.isInterState ?? false).totalTax
    : 0;
  const totalAmount = baseFare + taxAmount + tollCharges + parkingCharges + driverAllowance + extraCharges - discount;

  return {
    baseFare,
    taxAmount,
    tollCharges,
    parkingCharges,
    driverAllowance,
    extraCharges,
    discount,
    totalAmount: Math.round(totalAmount),
  };
}
