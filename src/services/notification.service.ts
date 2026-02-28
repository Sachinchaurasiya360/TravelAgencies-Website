import { prisma } from "@/lib/prisma";
import { NotificationChannel, NotificationType, NotificationStatus } from "@prisma/client";
import { sendEmail, bookingConfirmationEmail, statusUpdateEmail, paymentReminderEmail } from "./email.service";
import { sendSms, bookingConfirmationSms, statusUpdateSms, paymentReminderSms } from "./sms.service";
import { sendWhatsApp, bookingConfirmationWhatsApp, statusUpdateWhatsApp, paymentReminderWhatsApp } from "./whatsapp.service";
import { VEHICLE_TYPE_LABELS, BOOKING_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/helpers/currency";

interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
}

async function logNotification(params: {
  channel: NotificationChannel;
  type: NotificationType;
  status: NotificationStatus;
  recipientPhone?: string;
  recipientEmail?: string;
  subject?: string;
  body: string;
  bookingId?: string;
  providerMessageId?: string;
  errorMessage?: string;
}) {
  try {
    await prisma.notificationLog.create({ data: params });
  } catch (error) {
    console.error("Notification log error:", error);
  }
}

export async function sendBookingConfirmation(booking: {
  id: string;
  bookingId: string;
  vehicleType: string;
  pickupLocation: string;
  dropLocation: string;
  travelDate: Date;
  customer: { name: string; phone: string; email: string | null };
}): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];
  const settings = await prisma.settings.findUnique({ where: { id: "app_settings" } });
  const travelDateStr = booking.travelDate.toLocaleDateString("en-IN");
  const vehicleLabel = VEHICLE_TYPE_LABELS[booking.vehicleType] || booking.vehicleType;

  // Email
  if (settings?.emailEnabled && booking.customer.email) {
    const emailData = bookingConfirmationEmail({
      customerName: booking.customer.name,
      bookingId: booking.bookingId,
      vehicleType: vehicleLabel,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      travelDate: travelDateStr,
    });
    const result = await sendEmail({
      to: booking.customer.email,
      subject: emailData.subject,
      html: emailData.html,
    });
    results.push({ channel: "EMAIL", ...result });
    await logNotification({
      channel: "EMAIL",
      type: "BOOKING_CONFIRMATION",
      status: result.success ? "SENT" : "FAILED",
      recipientEmail: booking.customer.email,
      subject: emailData.subject,
      body: emailData.html,
      bookingId: booking.id,
      providerMessageId: result.messageId,
      errorMessage: result.error,
    });
  }

  // SMS
  if (settings?.smsEnabled) {
    const smsBody = bookingConfirmationSms(booking.bookingId, booking.customer.name);
    const result = await sendSms({ to: booking.customer.phone, body: smsBody });
    results.push({ channel: "SMS", ...result });
    await logNotification({
      channel: "SMS",
      type: "BOOKING_CONFIRMATION",
      status: result.success ? "SENT" : "FAILED",
      recipientPhone: booking.customer.phone,
      body: smsBody,
      bookingId: booking.id,
      providerMessageId: result.messageSid,
      errorMessage: result.error,
    });
  }

  // WhatsApp
  if (settings?.whatsappEnabled) {
    const waBody = bookingConfirmationWhatsApp(booking.bookingId, booking.customer.name, {
      vehicleType: vehicleLabel,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      travelDate: travelDateStr,
    });
    const result = await sendWhatsApp({ to: booking.customer.phone, body: waBody });
    results.push({ channel: "WHATSAPP", ...result });
    await logNotification({
      channel: "WHATSAPP",
      type: "BOOKING_CONFIRMATION",
      status: result.success ? "SENT" : "FAILED",
      recipientPhone: booking.customer.phone,
      body: waBody,
      bookingId: booking.id,
      providerMessageId: result.messageSid,
      errorMessage: result.error,
    });
  }

  return results;
}

export async function sendStatusNotification(booking: {
  id: string;
  bookingId: string;
  customer: { name: string; phone: string; email: string | null };
}, newStatus: string): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];
  const settings = await prisma.settings.findUnique({ where: { id: "app_settings" } });
  const statusLabel = BOOKING_STATUS_LABELS[newStatus] || newStatus;
  const message = getStatusMessage(newStatus);

  const notificationType = getNotificationType(newStatus);

  // Email
  if (settings?.emailEnabled && booking.customer.email) {
    const emailData = statusUpdateEmail({
      customerName: booking.customer.name,
      bookingId: booking.bookingId,
      newStatus: statusLabel,
      message,
    });
    const result = await sendEmail({
      to: booking.customer.email,
      subject: emailData.subject,
      html: emailData.html,
    });
    results.push({ channel: "EMAIL", ...result });
    await logNotification({
      channel: "EMAIL",
      type: notificationType,
      status: result.success ? "SENT" : "FAILED",
      recipientEmail: booking.customer.email,
      subject: emailData.subject,
      body: emailData.html,
      bookingId: booking.id,
      providerMessageId: result.messageId,
      errorMessage: result.error,
    });
  }

  // SMS
  if (settings?.smsEnabled) {
    const smsBody = statusUpdateSms(booking.bookingId, statusLabel);
    const result = await sendSms({ to: booking.customer.phone, body: smsBody });
    results.push({ channel: "SMS", ...result });
    await logNotification({
      channel: "SMS",
      type: notificationType,
      status: result.success ? "SENT" : "FAILED",
      recipientPhone: booking.customer.phone,
      body: smsBody,
      bookingId: booking.id,
      providerMessageId: result.messageSid,
      errorMessage: result.error,
    });
  }

  // WhatsApp
  if (settings?.whatsappEnabled) {
    const waBody = statusUpdateWhatsApp(booking.bookingId, statusLabel, message);
    const result = await sendWhatsApp({ to: booking.customer.phone, body: waBody });
    results.push({ channel: "WHATSAPP", ...result });
    await logNotification({
      channel: "WHATSAPP",
      type: notificationType,
      status: result.success ? "SENT" : "FAILED",
      recipientPhone: booking.customer.phone,
      body: waBody,
      bookingId: booking.id,
      providerMessageId: result.messageSid,
      errorMessage: result.error,
    });
  }

  return results;
}

export async function sendPaymentReminderNotification(booking: {
  id: string;
  bookingId: string;
  totalAmount: unknown;
  paymentDueDate: Date | null;
  customer: { name: string; phone: string; email: string | null };
}, channels: NotificationChannel[], customMessage?: string): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];
  const amount = formatCurrency(booking.totalAmount as string);
  const dueDate = booking.paymentDueDate?.toLocaleDateString("en-IN");

  for (const channel of channels) {
    if (channel === "EMAIL" && booking.customer.email) {
      const emailData = paymentReminderEmail({
        customerName: booking.customer.name,
        bookingId: booking.bookingId,
        amount,
        dueDate,
      });
      const result = await sendEmail({
        to: booking.customer.email,
        subject: emailData.subject,
        html: emailData.html,
      });
      results.push({ channel: "EMAIL", ...result });
      await logNotification({
        channel: "EMAIL",
        type: "PAYMENT_REMINDER",
        status: result.success ? "SENT" : "FAILED",
        recipientEmail: booking.customer.email,
        subject: emailData.subject,
        body: customMessage || emailData.html,
        bookingId: booking.id,
        providerMessageId: result.messageId,
        errorMessage: result.error,
      });
    }

    if (channel === "SMS") {
      const smsBody = customMessage || paymentReminderSms(booking.bookingId, amount);
      const result = await sendSms({ to: booking.customer.phone, body: smsBody });
      results.push({ channel: "SMS", ...result });
      await logNotification({
        channel: "SMS",
        type: "PAYMENT_REMINDER",
        status: result.success ? "SENT" : "FAILED",
        recipientPhone: booking.customer.phone,
        body: smsBody,
        bookingId: booking.id,
        providerMessageId: result.messageSid,
        errorMessage: result.error,
      });
    }

    if (channel === "WHATSAPP") {
      const waBody = customMessage || paymentReminderWhatsApp(booking.bookingId, amount, dueDate);
      const result = await sendWhatsApp({ to: booking.customer.phone, body: waBody });
      results.push({ channel: "WHATSAPP", ...result });
      await logNotification({
        channel: "WHATSAPP",
        type: "PAYMENT_REMINDER",
        status: result.success ? "SENT" : "FAILED",
        recipientPhone: booking.customer.phone,
        body: waBody,
        bookingId: booking.id,
        providerMessageId: result.messageSid,
        errorMessage: result.error,
      });
    }
  }

  return results;
}

function getStatusMessage(status: string): string {
  switch (status) {
    case "APPROVED":
      return "Your booking has been approved. We will send you a confirmation with pricing details soon.";
    case "CONFIRMED":
      return "Your booking is confirmed! Your vehicle will be ready on the scheduled date.";
    case "IN_PROGRESS":
      return "Your trip is now in progress. Have a safe and comfortable journey!";
    case "COMPLETED":
      return "Your trip has been completed. Thank you for traveling with us!";
    case "CANCELLED":
      return "Your booking has been cancelled. Contact us if you have any questions.";
    case "REJECTED":
      return "We are unable to fulfill your booking request. Please contact us for alternatives.";
    default:
      return "Your booking status has been updated.";
  }
}

function getNotificationType(status: string): NotificationType {
  switch (status) {
    case "APPROVED": return "BOOKING_APPROVED";
    case "REJECTED": return "BOOKING_REJECTED";
    case "CANCELLED": return "BOOKING_CANCELLED";
    default: return "STATUS_UPDATE";
  }
}
