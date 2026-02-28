import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, InvoiceStatus, ActivityAction } from "@prisma/client";
import { createInvoiceSchema } from "@/validators/invoice.validator";
import { generateInvoiceNumber } from "@/lib/helpers/booking-id";
import { calculateGst } from "@/lib/helpers/gst";
import { amountToWords } from "@/lib/helpers/currency";
import {
  successResponse,
  errorResponse,
  requireAuth,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";
import { logActivity } from "@/services/activity-log.service";

// GET /api/invoices - List all invoices (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);

    const status = searchParams.get("status") as InvoiceStatus | null;
    const search = searchParams.get("search");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: Prisma.InvoiceWhereInput = {};

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
        { booking: { bookingId: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (fromDate || toDate) {
      where.invoiceDate = {};
      if (fromDate) where.invoiceDate.gte = new Date(fromDate);
      if (toDate) where.invoiceDate.lte = new Date(toDate);
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          booking: { select: { bookingId: true, tripType: true, vehicleType: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return successResponse({
      invoices,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Invoices list error:", error);
    return errorResponse("Failed to fetch invoices", 500);
  }
}

// POST /api/invoices - Create invoice from booking (admin only)
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;

    // Fetch booking with customer
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { customer: true },
    });

    if (!booking) return errorResponse("Booking not found", 404);

    if (!booking.baseFare || !booking.totalAmount) {
      return errorResponse("Booking pricing must be set before creating an invoice", 400);
    }

    // Fetch company settings
    const settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
    });

    if (!settings) {
      return errorResponse("Company settings not configured. Please configure settings first.", 400);
    }

    // Calculate GST
    const subtotal = Number(booking.baseFare);
    const isInterState = data.isInterState ?? false;
    const gst = calculateGst(subtotal, isInterState);

    // Calculate grand total
    const tollCharges = Number(booking.tollCharges || 0);
    const driverAllowance = Number(booking.driverAllowance || 0);
    const extraCharges = Number(booking.extraCharges || 0);
    const discount = Number(booking.discount || 0);
    const grandTotal = subtotal + gst.totalTax + tollCharges + driverAllowance + extraCharges - discount;

    // Calculate amount already paid for this booking
    const paidResult = await prisma.payment.aggregate({
      where: { bookingId: data.bookingId },
      _sum: { amount: true },
    });
    const amountPaid = Number(paidResult._sum.amount || 0);
    const balanceDue = Math.max(0, grandTotal - amountPaid);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate due date
    const dueDate = data.dueDate || new Date(
      Date.now() + (settings.defaultPaymentDueDays || 7) * 24 * 60 * 60 * 1000
    );

    // Service description
    const serviceDescription = data.serviceDescription ||
      `Transportation service - ${booking.pickupLocation} to ${booking.dropLocation}`;

    // Create the invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        bookingId: booking.id,
        customerId: booking.customerId,
        invoiceDate: new Date(),
        dueDate,

        // Company details from settings
        companyName: settings.companyName,
        companyAddress: [settings.companyAddress, settings.companyCity, settings.companyState, settings.companyPincode]
          .filter(Boolean)
          .join(", "),
        companyGstin: settings.companyGstin || "",
        companyPhone: settings.companyPhone || "",
        companyEmail: settings.companyEmail || "",
        companyState: settings.companyState || "",
        companyStateCode: settings.companyStateCode || "",

        // Customer details from Customer
        customerName: booking.customer.name,
        customerAddress: [booking.customer.address, booking.customer.city, booking.customer.state, booking.customer.pincode]
          .filter(Boolean)
          .join(", ") || null,
        customerPhone: booking.customer.phone,
        customerEmail: booking.customer.email || null,
        customerGstin: booking.customer.gstin || null,
        customerState: booking.customer.state || null,

        serviceDescription,
        sacCode: settings.defaultSacCode || "9964",

        // Amounts
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
        amountPaid,
        balanceDue: Math.round(balanceDue * 100) / 100,

        isInterState,
        placeOfSupply: settings.companyState || null,

        termsAndConditions: data.termsAndConditions || settings.invoiceTerms || null,
        notes: data.notes || settings.invoiceNotes || null,
      },
      include: {
        booking: { select: { bookingId: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    logActivity({
      action: ActivityAction.INVOICE_CREATED,
      description: `Invoice ${invoice.invoiceNumber} created for booking ${invoice.booking.bookingId}`,
      userId: session.user.id,
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: { invoiceNumber: invoice.invoiceNumber, bookingId: invoice.booking.bookingId },
    }).catch(console.error);

    return successResponse(invoice, 201);
  } catch (error) {
    console.error("Invoice creation error:", error);
    return errorResponse("Failed to create invoice", 500);
  }
}
