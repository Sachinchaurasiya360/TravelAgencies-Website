import { Resend } from "resend";

let resend: Resend | null = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const fromEmail = process.env.EMAIL_FROM || "noreply@travelagency.com";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

// Email templates
export function bookingConfirmationEmail(data: {
  customerName: string;
  bookingId: string;
  pickupLocation: string;
  dropLocation: string;
  travelDate: string;
}): { subject: string; html: string } {
  return {
    subject: `Booking Confirmed - #${data.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Sarthak Tour and Travels</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Booking Request Received!</h2>
          <p>Dear ${data.customerName},</p>
          <p>Thank you for your booking request. Here are your booking details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Booking ID</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">#${data.bookingId}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Pickup</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.pickupLocation}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Drop</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.dropLocation}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Travel Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.travelDate}</td></tr>
          </table>
          <p>Our team will review your request and get back to you shortly with confirmation and pricing.</p>
          <p>Please save your Booking ID <strong>#${data.bookingId}</strong> for tracking.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you have any questions, contact us at +91 74981 25466</p>
        </div>
      </div>
    `,
  };
}

export function statusUpdateEmail(data: {
  customerName: string;
  bookingId: string;
  newStatus: string;
  message: string;
}): { subject: string; html: string } {
  return {
    subject: `Booking ${data.newStatus} - ${data.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Sarthak Tour and Travels</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Booking Status Update</h2>
          <p>Dear ${data.customerName},</p>
          <p>Your booking <strong>${data.bookingId}</strong> has been updated to: <strong>${data.newStatus}</strong></p>
          <p>${data.message}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you have any questions, contact us at +91 74981 25466</p>
        </div>
      </div>
    `,
  };
}

export function paymentReminderEmail(data: {
  customerName: string;
  bookingId: string;
  amount: string;
  dueDate?: string;
}): { subject: string; html: string } {
  return {
    subject: `Payment Reminder - ${data.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Sarthak Tour and Travels</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Payment Reminder</h2>
          <p>Dear ${data.customerName},</p>
          <p>This is a reminder that a payment of <strong>${data.amount}</strong> is pending for your booking <strong>${data.bookingId}</strong>.</p>
          ${data.dueDate ? `<p>Due date: <strong>${data.dueDate}</strong></p>` : ""}
          <p>Please make the payment at your earliest convenience.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you have already made the payment, please ignore this reminder. Contact us at +91 70704 16209</p>
        </div>
      </div>
    `,
  };
}
