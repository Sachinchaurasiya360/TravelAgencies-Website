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

export function rideCompletionWithBillEmail(data: {
  customerName: string;
  bookingId: string;
  pickupLocation: string;
  dropLocation: string;
  travelDate: string;
  driverName?: string;
  totalAmount: string;
  invoiceUrl: string;
  companyName: string;
}): { subject: string; html: string } {
  return {
    subject: `Ride Completed - Bill for #${data.bookingId} | ${data.companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${data.companyName}</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #16a34a;">Ride Completed Successfully!</h2>
          <p>Dear ${data.customerName},</p>
          <p>Thank you for travelling with us! Your ride has been completed successfully.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Booking ID</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">#${data.bookingId}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Pickup</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.pickupLocation}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Drop</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.dropLocation}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Travel Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.travelDate}</td></tr>
            ${data.driverName ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Driver</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.driverName}</td></tr>` : ""}
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Total Amount</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #2563eb;">${data.totalAmount}</td></tr>
          </table>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.invoiceUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View & Download Bill</a>
          </div>
          <p style="color: #666; font-size: 13px;">Click the button above to view your invoice, download the bill, or sign it digitally.</p>
          <p>We hope you had a great experience. Looking forward to serving you again!</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you have any questions, contact us at +91 74981 25466</p>
        </div>
      </div>
    `,
  };
}

export function otpEmail(data: {
  otp: string;
  userEmail: string;
}): { subject: string; html: string } {
  return {
    subject: `Your Login Code - Sarthak Tour and Travels`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Sarthak Tour and Travels</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Login Verification Code</h2>
          <p>A login attempt was made for <strong>${data.userEmail}</strong>.</p>
          <p>Your one-time password is:</p>
          <div style="text-align: center; margin: 24px 0; padding: 16px; background: #f3f4f6; border-radius: 8px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827;">${data.otp}</span>
          </div>
          <p style="color: #666;">This code will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #dc2626; font-size: 13px; margin-top: 24px;">If you did not request this code, please ignore this email.</p>
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
