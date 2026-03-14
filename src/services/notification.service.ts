import { prisma } from "@/lib/prisma";
import { NotificationChannel, NotificationType, NotificationStatus } from "@prisma/client";
import { sendEmail, bookingConfirmationEmail, statusUpdateEmail, paymentReminderEmail } from "./email.service";
import { generateWhatsAppUrl, bookingConfirmationWhatsApp, statusUpdateWhatsApp, paymentReminderWhatsApp } from "./whatsapp.service";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/helpers/currency";

interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
  whatsappUrl?: string;
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
  pickupLocation: string;
  dropLocation: string;
  travelDate: Date;
  customer: { name: string; phone: string; email: string | null };
}): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];
  const settings = await prisma.settings.findUnique({ where: { id: "app_settings" } });
  const travelDateStr = booking.travelDate.toLocaleDateString("en-IN");

  // Email
  if (settings?.emailEnabled && booking.customer.email) {
    const emailData = bookingConfirmationEmail({
      customerName: booking.customer.name,
      bookingId: booking.bookingId,
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

  // WhatsApp — generate wa.me URL (admin opens it manually)
  if (settings?.whatsappEnabled) {
    const waBody = bookingConfirmationWhatsApp(booking.bookingId, booking.customer.name, {
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      travelDate: travelDateStr,
    });
    const whatsappUrl = generateWhatsAppUrl(booking.customer.phone, waBody);
    results.push({ channel: "WHATSAPP", success: true, whatsappUrl });
    await logNotification({
      channel: "WHATSAPP",
      type: "BOOKING_CONFIRMATION",
      status: "SENT",
      recipientPhone: booking.customer.phone,
      body: waBody,
      bookingId: booking.id,
    });
  }

  return results;
}

export async function sendStatusNotification(booking: {
  id: string;
  bookingId: string;
  customer: { name: string; phone: string; email: string | null };
  totalAmount?: unknown;
  tollCharges?: unknown;
  extraCharges?: unknown;
  extraChargesNote?: string | null;
  driver?: { name: string; phone: string | null } | null;
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

  // WhatsApp — generate wa.me URL with pricing + driver details
  if (settings?.whatsappEnabled) {
    const pricing = booking.totalAmount ? {
      totalAmount: formatCurrency(booking.totalAmount as string),
      tollCharges: Number(booking.tollCharges || 0),
      extraCharges: Number(booking.extraCharges || 0),
      extraChargesNote: booking.extraChargesNote || undefined,
    } : undefined;
    const driver = booking.driver ? {
      name: booking.driver.name,
      phone: booking.driver.phone,
    } : undefined;
    const waBody = statusUpdateWhatsApp(booking.bookingId, statusLabel, message, pricing, driver);
    const whatsappUrl = generateWhatsAppUrl(booking.customer.phone, waBody);
    results.push({ channel: "WHATSAPP", success: true, whatsappUrl });
    await logNotification({
      channel: "WHATSAPP",
      type: notificationType,
      status: "SENT",
      recipientPhone: booking.customer.phone,
      body: waBody,
      bookingId: booking.id,
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

    if (channel === "WHATSAPP") {
      const waBody = customMessage || paymentReminderWhatsApp(booking.bookingId, amount, dueDate);
      const whatsappUrl = generateWhatsAppUrl(booking.customer.phone, waBody);
      results.push({ channel: "WHATSAPP", success: true, whatsappUrl });
      await logNotification({
        channel: "WHATSAPP",
        type: "PAYMENT_REMINDER",
        status: "SENT",
        recipientPhone: booking.customer.phone,
        body: waBody,
        bookingId: booking.id,
      });
    }
  }

  return results;
}

function getStatusMessage(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "Your booking is confirmed! Your vehicle will be ready on the scheduled date.";
    case "COMPLETED":
      return "Your ride has been completed successfully. Thank you for travelling with us! We hope you had a great experience.";
    case "CANCELLED":
      return "Your booking has been cancelled. Contact us if you have any questions.";
    default:
      return "Your booking status has been updated.";
  }
}

function getNotificationType(status: string): NotificationType {
  switch (status) {
    case "CONFIRMED": return "BOOKING_CONFIRMED";
    case "COMPLETED": return "STATUS_UPDATE";
    case "CANCELLED": return "BOOKING_CANCELLED";
    default: return "STATUS_UPDATE";
  }
}
