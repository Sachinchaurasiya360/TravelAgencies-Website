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
  _pricing?: {
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (status === "Completed") {
    let text = `Dear Customer,

Thank you for travelling with *Sarthak Tour and Travels*!

Your ride (Booking #${bookingId}) has been completed successfully. We hope you had a pleasant journey.

Your invoice will be shared with you shortly.`;
    text += `\n\nFor any queries, feel free to reach out to us.

Warm regards,
*Sarthak Tour and Travels*`;
    return text;
  }

  // Confirmed / Cancelled / Other statuses
  let text = `Dear Customer,

*Booking #${bookingId}* — *${status}*

${message}`;

  if (driver) {
    text += `\n\n*Driver Details:*\nName: ${driver.name}`;
    if (driver.phone) {
      text += `\nContact: ${driver.phone}`;
    }
  }

  text += `\n\nTrack your booking:\n${appUrl}/track`;
  text += `\n\nWarm regards,\n*Sarthak Tour and Travels*`;
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
