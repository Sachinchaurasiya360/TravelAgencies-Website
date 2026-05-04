/**
 * WhatsApp service — generates wa.me redirect URLs (no Twilio).
 * The admin opens the link → WhatsApp opens with the message pre-filled.
 */

function formatPhoneForWaMe(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  // Already has country code (91 + 10 digits)
  if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned;
  // 10-digit Indian number
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
}

export function generateWhatsAppUrl(phone: string, message: string): string {
  const waPhone = formatPhoneForWaMe(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${waPhone}?text=${encoded}`;
}

// WhatsApp message templates

export function bookingConfirmationWhatsApp(
  bookingId: string,
  customerName: string,
  details: {
    pickupLocation: string;
    dropLocation: string;
    travelDate: string;
    pickupTime?: string | null;
    companyName?: string;
  }
): string {
  const company = details.companyName || "Sarthak Tours And Travels";
  const pickupTime = details.pickupTime || "-";

  return `Dear ${customerName},
your journey with *${company}*

Journey Details for travel on *${details.travelDate}*
*Invoice*: -
*Trip*: ${details.pickupLocation} *To* ${details.dropLocation}

Boarding Details
*Pickup point Address*: ${details.pickupLocation}
*Departure time*: ${pickupTime}

Car Details
*Car Number*: -
*Driver Details*: -

*${company}*
Your Travel Partner`;
}

export function statusUpdateWhatsApp(
  bookingId: string,
  status: string,
  message: string,
  pricing?: {
    totalAmount: string;
    baseFare: number;
    tollCharges: number;
    parkingCharges: number;
    driverAllowance: number;
    extraCharges: number;
    extraChargesNote?: string;
    discount: number;
  } | null,
  driver?: {
    name: string;
    phone: string | null;
    vehicleNumber?: string | null;
    vehicleName?: string | null;
  } | null,
  vendor?: {
    name: string;
    phone: string | null;
  } | null,
  bookingDetails?: {
    customerName?: string;
    companyName?: string;
    pickupLocation?: string;
    dropLocation?: string;
    travelDate?: string;
    pickupTime?: string | null;
  } | null
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const company = bookingDetails?.companyName || "Sarthak Tours And Travels";
  const rawStatus = status.toUpperCase();

  // ── CONFIRMED ──────────────────────────────────────────────
  if (rawStatus === "CONFIRMED" || rawStatus === "BOOKING CONFIRMED") {
    const travelDate = bookingDetails?.travelDate || "-";
    const from = bookingDetails?.pickupLocation || "-";
    const to = bookingDetails?.dropLocation || "-";
    const pickupTime = bookingDetails?.pickupTime || "";
    const vehicle = [driver?.vehicleName, driver?.vehicleNumber].filter(Boolean).join(" ") || "";

    let msg = `Your Booking for ${from} To ${to} on ${travelDate} is confirmed`;
    if (vehicle) msg += ` with ${vehicle}`;
    msg += `\n`;
    if (pickupTime) msg += `\nPickup Time - ${pickupTime}\n`;

    if (pricing) {
      const fare = pricing.baseFare;
      if (fare > 0) msg += `\nFare: Rs ${fare.toFixed(2)}`;
      if (pricing.parkingCharges > 0) msg += `\nParking- ${pricing.parkingCharges.toFixed(0)}`;
      if (pricing.tollCharges > 0) msg += `\nToll- ${pricing.tollCharges.toFixed(0)}`;
      if (pricing.driverAllowance > 0) msg += `\nDriver Allowance- ${pricing.driverAllowance.toFixed(0)}`;
      if (pricing.extraCharges > 0) msg += `\n${pricing.extraChargesNote || "Other Charges"}- ${pricing.extraCharges.toFixed(0)}`;
      if (pricing.discount > 0) msg += `\nDiscount- ${pricing.discount.toFixed(0)}`;
      const total = Number(pricing.totalAmount.replace(/[^0-9.-]/g, "") || 0);
      if (total > 0) msg += `\nTotal Fare - ${total.toFixed(0)}`;
    }

    msg += `\n\nDrop Address - ${to}`;
    if (driver) {
      msg += `\n\nDriver Details - ${driver.name}`;
      if (driver.phone) msg += ` (${driver.phone})`;
    }
    if (vendor) {
      msg += `\nVendor - ${vendor.name}`;
      if (vendor.phone) msg += ` (${vendor.phone})`;
    }
    msg += `\n\nBooking & Office Contact No: 7498125466 , 9527806257.`;
    msg += `\nOffice Locations- https://maps.app.goo.gl/FXW3xSEyYHFGczPs7?g_st=com.google.maps.preview.copy`;

    return msg;
  }

  // ── CANCELLED ──────────────────────────────────────────────
  if (rawStatus === "CANCELLED" || rawStatus === "BOOKING CANCELLED") {
    return `Dear Customer,

Your booking *#${bookingId}* has been cancelled.

${message}

For any queries, contact us.

Regards,
*${company}*`;
  }

  // ── Other statuses ─────────────────────────────────────────
  let text = `Dear Customer,

*Booking #${bookingId}* — *${status}*

${message}`;

  if (driver) {
    text += `\n\n*Driver Details:*\nName: ${driver.name}`;
    if (driver.phone) text += `\nContact: ${driver.phone}`;
  }
  if (vendor) {
    text += `\n\n*Vendor Details:*\nName: ${vendor.name}`;
    if (vendor.phone) text += `\nContact: ${vendor.phone}`;
  }

  text += `\n\nTrack your booking:\n${appUrl}/track`;
  text += `\n\nWarm regards,\n*${company}*`;
  return text;
}

export function paymentReminderWhatsApp(
  bookingId: string,
  amount: string,
  dueDate?: string,
  driver?: {
    name: string;
    phone: string | null;
    vehicleNumber?: string | null;
    vehicleName?: string | null;
  } | null,
  vendor?: {
    name: string;
    phone: string | null;
  } | null
): string {
  const vehicle = [driver?.vehicleName, driver?.vehicleNumber].filter(Boolean).join(" ");
  return `Payment Reminder

*Booking:* ${bookingId}
*Amount Due:* ${amount}
${dueDate ? `*Due Date:* ${dueDate}` : ""}
${driver ? `\n*Driver:* ${driver.name}${driver.phone ? ` (${driver.phone})` : ""}${vehicle ? `\n*Vehicle:* ${vehicle}` : ""}` : ""}
${vendor ? `\n*Vendor:* ${vendor.name}${vendor.phone ? ` (${vendor.phone})` : ""}` : ""}

Please make the payment at your earliest convenience.

- Sarthak Tours And Travels`;
}
