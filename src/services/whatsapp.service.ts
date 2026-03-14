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
  details: { pickupLocation: string; dropLocation: string; travelDate: string }
): string {
  return `Hello ${customerName}!

Your booking request has been received.

*Booking ID:* ${bookingId}
*Pickup:* ${details.pickupLocation}
*Drop:* ${details.dropLocation}
*Date:* ${details.travelDate}

Our team will review and confirm your booking shortly.

Track your booking: ${process.env.NEXT_PUBLIC_APP_URL}/track

- Sarthak Tour and Travels`;
}

export function statusUpdateWhatsApp(
  bookingId: string,
  status: string,
  message: string,
  pricing?: {
    totalAmount: string;
    tollCharges: number;
    extraChargesNote?: string;
    extraCharges: number;
  },
  driver?: {
    name: string;
    phone: string | null;
  }
): string {
  const isCompleted = status === "Completed";
  let text = isCompleted
    ? `Hello! 🙏\n\n${message}\n\n*Booking:* ${bookingId}`
    : `Booking Update\n\n*Booking:* ${bookingId}\n*Status:* ${status}\n\n${message}`;

  if (driver && !isCompleted) {
    text += `\n\n*Driver:* ${driver.name}`;
    if (driver.phone) {
      text += `\n*Driver Contact:* ${driver.phone}`;
    }
  }

  if (pricing) {
    const priceLabel = isCompleted ? "*Total Amount:*" : "*Expected Price:*";
    text += `\n\n${priceLabel} ${pricing.totalAmount}`;
    if (!isCompleted && pricing.tollCharges > 0) {
      text += `\nFastTag/Toll charges will be applicable as per actual.`;
    }
    if (!isCompleted && pricing.extraCharges > 0 && pricing.extraChargesNote) {
      text += `\n${pricing.extraChargesNote}: Extra charges applicable.`;
    }
  }

  if (isCompleted) {
    text += `\n\nWe look forward to serving you again! 🚗`;
  } else {
    text += `\n\nTrack: ${process.env.NEXT_PUBLIC_APP_URL}/track`;
  }

  text += `\n\n- Sarthak Tour and Travels`;
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

- Sarthak Tour and Travels`;
}
