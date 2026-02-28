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

interface SendSmsParams {
  to: string;
  body: string;
}

export async function sendSms(params: SendSmsParams): Promise<{
  success: boolean;
  messageSid?: string;
  error?: string;
}> {
  const client = getClient();
  if (!client) {
    console.warn("Twilio not configured, skipping SMS");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formatPhoneE164(params.to),
      body: params.body,
    });

    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error("SMS send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

// SMS templates
export function bookingConfirmationSms(bookingId: string, customerName: string): string {
  return `Dear ${customerName}, your booking ${bookingId} has been received. We will confirm it shortly. Track: ${process.env.NEXT_PUBLIC_APP_URL}/track - Sarthak Tour and Travels`;
}

export function statusUpdateSms(bookingId: string, status: string): string {
  return `Your booking ${bookingId} status: ${status}. Track: ${process.env.NEXT_PUBLIC_APP_URL}/track - Sarthak Tour and Travels`;
}

export function paymentReminderSms(bookingId: string, amount: string): string {
  return `Reminder: Payment of ${amount} is pending for booking ${bookingId}. Please pay at your earliest. - Sarthak Tour and Travels`;
}
