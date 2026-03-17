export function calculateBookingTotal(params: {
  baseFare: number;
  tollCharges?: number;
  parkingCharges?: number;
  driverAllowance?: number;
  extraCharges?: number;
  discount?: number;
}): {
  baseFare: number;
  tollCharges: number;
  parkingCharges: number;
  driverAllowance: number;
  extraCharges: number;
  discount: number;
  totalAmount: number;
} {
  const { baseFare, tollCharges = 0, parkingCharges = 0, driverAllowance = 0, extraCharges = 0, discount = 0 } = params;
  const totalAmount = baseFare + tollCharges + parkingCharges + driverAllowance + extraCharges - discount;

  return {
    baseFare,
    tollCharges,
    parkingCharges,
    driverAllowance,
    extraCharges,
    discount,
    totalAmount: Math.round(totalAmount),
  };
}
