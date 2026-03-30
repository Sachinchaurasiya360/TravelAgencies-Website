import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { updateBookingStatusSchema } from "@/validators/booking.validator";
import { ALLOWED_STATUS_TRANSITIONS } from "@/lib/constants";
import { BookingStatus, ActivityAction, InvoiceStatus } from "@prisma/client";
import { sendStatusNotification, sendCompletionWithBill } from "@/services/notification.service";
import { logActivity } from "@/services/activity-log.service";
import { amountToWords } from "@/lib/helpers/currency";
import { randomUUID } from "crypto";

// PATCH /api/bookings/[id]/status - Transition booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateBookingStatusSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { status: newStatus, reason } = parsed.data;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return errorResponse("Booking not found", 404);

    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[booking.status];
    if (!allowedTransitions.includes(newStatus)) {
      return errorResponse(
        `Cannot transition from ${booking.status} to ${newStatus}`,
        400
      );
    }

    const updateData: {
      status: BookingStatus;
      confirmedAt?: Date;
      cancelledAt?: Date;
      cancellationReason?: string | null;
      completedAt?: Date;
    } = { status: newStatus as BookingStatus };

    switch (newStatus) {
      case "CONFIRMED":
        updateData.confirmedAt = new Date();
        break;
      case "COMPLETED":
        updateData.completedAt = new Date();
        break;
      case "CANCELLED":
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = reason || null;
        break;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        driver: { select: { name: true, phone: true, vehicleNumber: true, vehicleName: true } },
      },
    });

    // Log activity (fire-and-forget)
    logActivity({
      action: ActivityAction.BOOKING_STATUS_CHANGED,
      description: `Booking ${updated.bookingId} status changed from ${booking.status} to ${newStatus}`,
      userId: session.user.id,
      entityType: "Booking",
      entityId: updated.id,
      metadata: { bookingId: updated.bookingId, oldStatus: booking.status, newStatus },
    }).catch(console.error);

    // On COMPLETED: auto-create invoice + send bill email
    if (newStatus === "COMPLETED" && updated.baseFare && updated.totalAmount) {
      try {
        const completionResult = await handleCompletionBill(updated, session.user.id);
        return successResponse({
          ...updated,
          whatsappUrl: completionResult.whatsappUrl ?? null,
          invoiceShareUrl: completionResult.invoiceShareUrl ?? null,
        });
      } catch (err) {
        console.error("Completion bill error (non-fatal):", err);
        // Fall through to regular notification if bill creation fails
      }
    }

    // Send notification on status change (includes driver + pricing details)
    const notifResults = await sendStatusNotification(
      {
        id: updated.id,
        bookingId: updated.bookingId,
        customer: updated.customer,
        totalAmount: updated.totalAmount,
        tollCharges: updated.tollCharges,
        extraCharges: updated.extraCharges,
        extraChargesNote: updated.extraChargesNote,
        pickupLocation: updated.pickupLocation,
        dropLocation: updated.dropLocation,
        travelDate: updated.travelDate,
        pickupTime: updated.pickupTime,
        driver: updated.driver,
      },
      newStatus
    ).catch(() => [] as { channel: string; whatsappUrl?: string }[]);

    const waResult = notifResults?.find((r) => r.channel === "WHATSAPP" && r.whatsappUrl);

    return successResponse({ ...updated, whatsappUrl: waResult?.whatsappUrl ?? null });
  } catch (error) {
    console.error("Status transition error:", error);
    return errorResponse("Failed to update booking status", 500);
  }
}

// Auto-create invoice + share link + send bill email on ride completion
async function handleCompletionBill(
  booking: {
    id: string;
    bookingId: string;
    pickupLocation: string;
    dropLocation: string;
    travelDate: Date;
    baseFare: unknown;
    tollCharges: unknown;
    parkingCharges: unknown;
    driverAllowance: unknown;
    extraCharges: unknown;
    extraChargesNote: string | null;
    discount: unknown;
    totalAmount: unknown;
    customerId: string;
    customer: { name: string; phone: string; email: string | null };
    driver: { name: string; phone: string | null } | null;
  },
  adminUserId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // 1. Check if invoice already exists
  let invoice = await prisma.invoice.findFirst({
    where: { bookingId: booking.id },
    select: { id: true, invoiceNumber: true, shareToken: true },
  });

  // 2. Auto-create invoice if not exists
  if (!invoice) {
    const settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
    });
    if (!settings) throw new Error("Settings not configured");

    const customer = await prisma.customer.findUnique({
      where: { id: booking.customerId },
    });
    if (!customer) throw new Error("Customer not found");

    const subtotal = Number(booking.baseFare);
    const tollCharges = Number(booking.tollCharges || 0);
    const parkingCharges = Number(booking.parkingCharges || 0);
    const driverAllowance = Number(booking.driverAllowance || 0);
    const extraCharges = Number(booking.extraCharges || 0);
    const discount = Number(booking.discount || 0);
    const grandTotal = subtotal + tollCharges + parkingCharges + driverAllowance + extraCharges - discount;

    const dueDate = new Date(
      Date.now() + (settings.defaultPaymentDueDays || 7) * 24 * 60 * 60 * 1000
    );

    const paidResult = await prisma.payment.aggregate({
      where: { bookingId: booking.id },
      _sum: { amount: true },
    });
    const amountPaid = Number(paidResult._sum.amount || 0);
    const balanceDue = Math.max(0, grandTotal - amountPaid);

    const shareToken = randomUUID();

    invoice = await prisma.$transaction(async (tx) => {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const prefix = `INV-${today}-`;
      const lastInvoice = await tx.invoice.findFirst({
        where: { invoiceNumber: { startsWith: prefix } },
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
      });
      let seq = 1;
      if (lastInvoice) {
        seq = parseInt(lastInvoice.invoiceNumber.split("-").pop() || "0", 10) + 1;
      }
      const invoiceNumber = `${prefix}${seq.toString().padStart(4, "0")}`;

      return tx.invoice.create({
        data: {
          invoiceNumber,
          status: InvoiceStatus.DRAFT,
          bookingId: booking.id,
          customerId: booking.customerId,
          invoiceDate: new Date(),
          dueDate,
          shareToken,

          companyName: settings.companyName,
          companyAddress: [settings.companyAddress, settings.companyCity, settings.companyState, settings.companyPincode]
            .filter(Boolean).join(", "),
          companyGstin: settings.companyGstin || "",
          companyPhone: settings.companyPhone || "",
          companyEmail: settings.companyEmail || "",
          companyState: settings.companyState || "",
          companyStateCode: settings.companyStateCode || "",

          customerName: customer.name,
          customerAddress: [customer.address, customer.city, customer.state, customer.pincode]
            .filter(Boolean).join(", ") || null,
          customerPhone: customer.phone,
          customerEmail: customer.email || null,
          customerGstin: customer.gstin || null,
          customerState: customer.state || null,

          serviceDescription: `Transportation service - ${booking.pickupLocation} to ${booking.dropLocation}`,
          sacCode: settings.defaultSacCode || "9964",

          subtotal,
          cgstRate: 0, sgstRate: 0, igstRate: 0,
          cgstAmount: 0, sgstAmount: 0, igstAmount: 0,
          totalTax: 0,
          tollCharges,
          parkingCharges,
          driverAllowance,
          extraCharges,
          extraChargesNote: booking.extraChargesNote || null,
          discount,
          grandTotal: Math.round(grandTotal),
          amountInWords: amountToWords(Math.round(grandTotal)),
          amountPaid: Math.round(amountPaid),
          balanceDue: Math.round(balanceDue),

          isInterState: false,
          placeOfSupply: settings.companyState || null,
          termsAndConditions: settings.invoiceTerms || null,
          notes: settings.invoiceNotes || null,
        },
        select: { id: true, invoiceNumber: true, shareToken: true },
      });
    });

    logActivity({
      action: ActivityAction.INVOICE_CREATED,
      description: `Invoice ${invoice.invoiceNumber} auto-created on ride completion for booking ${booking.bookingId}`,
      userId: adminUserId,
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: { invoiceNumber: invoice.invoiceNumber, bookingId: booking.bookingId, autoCreated: true },
    }).catch(console.error);
  }

  // 3. Ensure share token exists
  let shareToken = invoice.shareToken;
  if (!shareToken) {
    shareToken = randomUUID();
    await prisma.invoice.updateMany({
      where: { id: invoice.id, shareToken: null },
      data: { shareToken },
    });
  }

  const invoiceShareUrl = `${appUrl}/invoice/${shareToken}`;

  // 4. Fetch company name for email
  const settings = await prisma.settings.findUnique({
    where: { id: "app_settings" },
    select: { companyName: true },
  });

  // 5. Send completion email with bill link
  const notifResults = await sendCompletionWithBill(
    {
      id: booking.id,
      bookingId: booking.bookingId,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      travelDate: booking.travelDate,
      totalAmount: booking.totalAmount,
      customer: booking.customer,
      driver: booking.driver,
    },
    invoiceShareUrl,
    settings?.companyName || "Sarthak Tour and Travels"
  ).catch(() => [] as { channel: string; whatsappUrl?: string }[]);

  const waResult = notifResults?.find((r) => r.channel === "WHATSAPP" && r.whatsappUrl);

  return { whatsappUrl: waResult?.whatsappUrl, invoiceShareUrl };
}
