import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/helpers/booking-id";
import { calculateGst } from "@/lib/helpers/gst";
import { amountToWords } from "@/lib/helpers/currency";
import { addDays } from "date-fns";

interface CreateInvoiceParams {
  bookingId: string;
  dueDate?: Date;
  serviceDescription?: string;
  termsAndConditions?: string;
  notes?: string;
  isInterState?: boolean;
}

export async function createInvoice(params: CreateInvoiceParams) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { customer: true },
  });

  if (!booking) throw new Error("Booking not found");
  if (!booking.baseFare) throw new Error("Booking pricing not assigned yet");

  const settings = await prisma.settings.findUnique({
    where: { id: "app_settings" },
  });

  if (!settings) throw new Error("App settings not found");

  const invoiceNumber = await generateInvoiceNumber();
  const isInterState = params.isInterState ?? settings.isInterState;
  const subtotal = Number(booking.baseFare);
  const gst = calculateGst(subtotal, isInterState);

  const tollCharges = Number(booking.tollCharges || 0);
  const driverAllowance = Number(booking.driverAllowance || 0);
  const extraCharges = Number(booking.extraCharges || 0);
  const discount = Number(booking.discount || 0);

  const grandTotal =
    subtotal + gst.totalTax + tollCharges + driverAllowance + extraCharges - discount;

  const defaultDueDate = addDays(new Date(), settings.defaultPaymentDueDays);

  const serviceDesc =
    params.serviceDescription ||
    `${booking.vehicleType.replace(/_/g, " ")} - ${booking.pickupLocation} to ${booking.dropLocation}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      bookingId: booking.id,
      customerId: booking.customerId,

      companyName: settings.companyName,
      companyAddress: [settings.companyAddress, settings.companyCity, settings.companyState, settings.companyPincode]
        .filter(Boolean)
        .join(", "),
      companyGstin: settings.companyGstin || "",
      companyPhone: settings.companyPhone || "",
      companyEmail: settings.companyEmail || "",
      companyState: settings.companyState || "",
      companyStateCode: settings.companyStateCode || "",

      customerName: booking.customer.name,
      customerAddress: [booking.customer.address, booking.customer.city, booking.customer.state, booking.customer.pincode]
        .filter(Boolean)
        .join(", ") || null,
      customerPhone: booking.customer.phone,
      customerEmail: booking.customer.email,
      customerGstin: booking.customer.gstin,
      customerState: booking.customer.state,

      serviceDescription: serviceDesc,
      sacCode: settings.defaultSacCode,

      subtotal,
      cgstRate: gst.cgstRate,
      sgstRate: gst.sgstRate,
      igstRate: gst.igstRate,
      cgstAmount: gst.cgstAmount,
      sgstAmount: gst.sgstAmount,
      igstAmount: gst.igstAmount,
      totalTax: gst.totalTax,
      tollCharges,
      driverAllowance,
      extraCharges,
      discount,
      grandTotal: Math.round(grandTotal * 100) / 100,
      amountInWords: amountToWords(Math.round(grandTotal * 100) / 100),
      balanceDue: Math.round(grandTotal * 100) / 100,
      isInterState,

      dueDate: params.dueDate || defaultDueDate,
      termsAndConditions: params.termsAndConditions || settings.invoiceTerms,
      notes: params.notes,

      status: "ISSUED",
    },
  });

  return invoice;
}
