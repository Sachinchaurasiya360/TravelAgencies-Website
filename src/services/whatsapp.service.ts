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
  const company = details.companyName || "Sarthak Unity Tours And Travels";
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
  _pricing?: {
    totalAmount: string;
    tollCharges: number;
    extraChargesNote?: string;
    extraCharges: number;
  } | null,
  driver?: {
    name: string;
    phone: string | null;
    vehicleNumber?: string | null;
    vehicleName?: string | null;
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
  const company = bookingDetails?.companyName || "Sarthak Unity Tours And Travels";
  const rawStatus = status.toUpperCase();

  // ── CONFIRMED ──────────────────────────────────────────────
  if (rawStatus === "CONFIRMED" || rawStatus === "BOOKING CONFIRMED") {
    const customerName = bookingDetails?.customerName || "Customer";
    const travelDate = bookingDetails?.travelDate || "-";
    const from = bookingDetails?.pickupLocation || "-";
    const to = bookingDetails?.dropLocation || "-";
    const pickupTime = bookingDetails?.pickupTime || "-";
    const carNumber = driver?.vehicleNumber || driver?.vehicleName || "-";
    const driverInfo = driver
      ? `${driver.name}${driver.phone ? ` (${driver.phone})` : ""}`
      : "-";

    return `Dear ${customerName},
your journey with *${company}*

Journey Details for travel on *${travelDate}*
*Invoice*: -
*Trip*: ${from} *To* ${to}

Boarding Details
*Pickup point Address*: ${from}
*Departure time*: ${pickupTime}

Car Details
*Car Number*: ${carNumber}
*Driver Details*: ${driverInfo}

*${company}*
Your Travel Partner`;
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

  text += `\n\nTrack your booking:\n${appUrl}/track`;
  text += `\n\nWarm regards,\n*${company}*`;
  return text;
}

export function paymentReminderWhatsApp(
  bookingId: string,
  amount: string,
  dueDate?: string
): string {
  return `Payment Reminder

*Booking:* ${bookingId}
*Amount Due:* ${amount}
${dueDate ? `*Due Date:* ${dueDate}` : ""}

Please make the payment at your earliest convenience.

- Sarthak Unity Tours And Travels`;
}
