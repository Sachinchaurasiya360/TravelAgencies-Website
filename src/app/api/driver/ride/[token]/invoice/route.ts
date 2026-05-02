import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus, ActivityAction } from "@prisma/client";
import { amountToWords } from "@/lib/helpers/currency";
import { invoiceNumberForBooking } from "@/lib/helpers/booking-id";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { logActivity } from "@/services/activity-log.service";

// POST /api/driver/ride/[token]/invoice - Public: create invoice via driver token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { driverAccessToken: token },
      include: { customer: true },
    });
    if (!booking) return errorResponse("Ride not found", 404);

    if (!booking.baseFare || !booking.totalAmount) {
      return errorResponse(
        "Booking pricing must be set before creating an invoice",
        400
      );
    }

    const settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
    });
    if (!settings) {
      return errorResponse(
        "Company settings not configured. Please configure settings first.",
        400
      );
    }

    const subtotal = Number(booking.baseFare);
    const tollCharges = Number(booking.tollCharges || 0);
    const parkingCharges = Number(booking.parkingCharges || 0);
    const driverAllowance = Number(booking.driverAllowance || 0);
    const extraCharges = Number(booking.extraCharges || 0);
    const discount = Number(booking.discount || 0);
    const grandTotal = subtotal + tollCharges + parkingCharges + driverAllowance + extraCharges - discount;

    const dueDate = new Date(
      Date.now() +
        (settings.defaultPaymentDueDays || 7) * 24 * 60 * 60 * 1000
    );

    const serviceDescription = `Transportation service - ${booking.pickupLocation} to ${booking.dropLocation}`;

    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = invoiceNumberForBooking(booking.bookingId);

      const paidResult = await tx.payment.aggregate({
        where: { bookingId: booking.id },
        _sum: { amount: true },
      });
      const amountPaid = Number(paidResult._sum.amount || 0);
      const balanceDue = Math.max(0, grandTotal - amountPaid);

      return tx.invoice.create({
        data: {
          invoiceNumber,
          status: InvoiceStatus.DRAFT,
          bookingId: booking.id,
          customerId: booking.customerId,
          invoiceDate: new Date(),
          dueDate,

          companyName: settings.companyName,
          companyAddress: [
            settings.companyAddress,
            settings.companyCity,
            settings.companyState,
            settings.companyPincode,
          ]
            .filter(Boolean)
            .join(", "),
          companyGstin: settings.companyGstin || "",
          companyPhone: settings.companyPhone || "",
          companyEmail: settings.companyEmail || "",
          companyState: settings.companyState || "",
          companyStateCode: settings.companyStateCode || "",

          customerName: booking.customer.name,
          customerAddress:
            [
              booking.customer.address,
              booking.customer.city,
              booking.customer.state,
              booking.customer.pincode,
            ]
              .filter(Boolean)
              .join(", ") || null,
          customerPhone: booking.customer.phone,
          customerEmail: booking.customer.email || null,
          customerGstin: booking.customer.gstin || null,
          customerState: booking.customer.state || null,

          serviceDescription,
          sacCode: settings.defaultSacCode || "9964",

          subtotal,
          cgstRate: 0,
          sgstRate: 0,
          igstRate: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
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
        include: {
          booking: { select: { bookingId: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
      });
    });

    logActivity({
      action: ActivityAction.INVOICE_CREATED,
      description: `Invoice ${invoice.invoiceNumber} created via driver link for booking ${invoice.booking.bookingId}`,
      userId: booking.driverId ?? undefined,
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        bookingId: invoice.booking.bookingId,
        viaDriverLink: true,
      },
    }).catch(console.error);

    return successResponse(invoice, 201);
  } catch (error) {
    console.error("Driver ride invoice error:", error);
    return errorResponse("Failed to create invoice", 500);
  }
}
