import twilio from "twilio";
import { formatPhoneE164 } from "@/lib/helpers/phone";

let twilioClient: twilio.Twilio | null = null;

function getClient(): twilio.Twilio | null {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  if (!twilioClient) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
}

interface SendWhatsAppParams {
  to: string;
  body: string;
  templateSid?: string;
  variables?: Record<string, string>;
}

export async function sendWhatsApp(params: SendWhatsAppParams): Promise<{
  success: boolean;
  messageSid?: string;
  error?: string;
}> {
  const client = getClient();
  if (!client || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.warn("Twilio WhatsApp not configured, skipping");
    return { success: false, error: "WhatsApp service not configured" };
  }

  try {
    const toNumber = formatPhoneE164(params.to);
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER.startsWith("whatsapp:")
      ? process.env.TWILIO_WHATSAPP_NUMBER
      : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

    const message = await client.messages.create({
      from: fromNumber,
      to: `whatsapp:${toNumber}`,
      body: params.body,
    });

    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send WhatsApp",
    };
  }
}

// WhatsApp templates (same content as SMS, but can be longer)
export function bookingConfirmationWhatsApp(
  bookingId: string,
  customerName: string,
  details: { pickupLocation: string; dropLocation: string; travelDate: string }
): string {
  return `Hello ${customerName}! 🚗

Your booking request has been received.

📋 *Booking ID:* ${bookingId}
📍 *Pickup:* ${details.pickupLocation}
📍 *Drop:* ${details.dropLocation}
📅 *Date:* ${details.travelDate}

Our team will review and confirm your booking shortly.

Track your booking: ${process.env.NEXT_PUBLIC_APP_URL}/track

- Sarthak Tour and Travels`;
}

export function statusUpdateWhatsApp(
  bookingId: string,
  status: string,
  message: string
): string {
  return `Booking Update 📢

*Booking:* ${bookingId}
*Status:* ${status}

${message}

Track: ${process.env.NEXT_PUBLIC_APP_URL}/track

- Sarthak Tour and Travels`;
}

export function paymentReminderWhatsApp(
  bookingId: string,
  amount: string,
  dueDate?: string
): string {
  return `Payment Reminder 💰

*Booking:* ${bookingId}
*Amount Due:* ${amount}
${dueDate ? `*Due Date:* ${dueDate}` : ""}

Please make the payment at your earliest convenience.

- Sarthak Tour and Travels`;
}
