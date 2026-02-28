import { z } from "zod";
import { BOOKING_STATUSES, VEHICLE_TYPES, TRIP_TYPES } from "@/lib/constants";

export const createBookingSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
    phone: z
      .string()
      .min(10)
      .max(13)
      .regex(/^(\+91)?[6-9]\d{9}$/, "Must be a valid Indian mobile number"),
    email: z.string().email().optional().or(z.literal("")),
    tripType: z.enum(TRIP_TYPES, { message: "Please select a trip type" }),
    vehicleType: z.enum(VEHICLE_TYPES, { message: "Please select a vehicle type" }),
    vehiclePreference: z.string().max(200).optional(),
    passengerCount: z
      .number({ message: "Passenger count is required" })
      .int()
      .min(1, "At least 1 passenger required")
      .max(60, "Maximum 60 passengers"),
    travelDate: z.coerce
      .date({ message: "Travel date is required" })
      .refine((d) => d > new Date(), "Travel date must be in the future"),
    returnDate: z.coerce.date().optional(),
    pickupLocation: z.string().min(2, "Pickup location is required").max(500).trim(),
    pickupAddress: z.string().max(1000).optional(),
    dropLocation: z.string().min(2, "Drop location is required").max(500).trim(),
    dropAddress: z.string().max(1000).optional(),
    pickupTime: z.string().max(20).optional(),
    passengerDetails: z
      .array(
        z.object({
          name: z.string().min(1).max(100),
          age: z.number().int().min(0).max(120).optional(),
          phone: z.string().optional(),
          idType: z.string().optional(),
          idNumber: z.string().optional(),
        })
      )
      .optional(),
    specialRequests: z.string().max(2000).optional(),
  })
  .refine(
    (data) => {
      if (data.tripType === "ROUND_TRIP" && !data.returnDate) {
        return false;
      }
      return true;
    },
    {
      message: "Return date is required for round-trip bookings",
      path: ["returnDate"],
    }
  )
  .refine(
    (data) => {
      if (data.returnDate && data.travelDate && data.returnDate <= data.travelDate) {
        return false;
      }
      return true;
    },
    {
      message: "Return date must be after travel date",
      path: ["returnDate"],
    }
  );

export const assignPricingSchema = z.object({
  baseFare: z.number().positive("Base fare must be positive").max(10000000),
  tollCharges: z.number().min(0).default(0),
  driverAllowance: z.number().min(0).default(0),
  extraCharges: z.number().min(0).default(0),
  extraChargesNote: z.string().max(500).optional(),
  discount: z.number().min(0).default(0),
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
