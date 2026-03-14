import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, InvoiceStatus, ActivityAction } from "@prisma/client";
import { createInvoiceSchema } from "@/validators/invoice.validator";
import { calculateGst } from "@/lib/helpers/gst";
import { amountToWords } from "@/lib/helpers/currency";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  requireAuth,
  getPaginationParams,
  paginationMeta,
  safeSortField,
  validEnumOrUndefined,
} from "@/lib/api-helpers";
import { logActivity } from "@/services/activity-log.service";

const INVOICE_SORT_FIELDS = ["createdAt", "invoiceDate", "grandTotal", "invoiceNumber"];
const VALID_INVOICE_STATUSES = ["DRAFT", "ISSUED", "PAID", "PARTIALLY_PAID", "CANCELLED", "VOID"];

// GET /api/invoices - List all invoices (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);

    const status = validEnumOrUndefined(searchParams.get("status"), VALID_INVOICE_STATUSES);
    const search = searchParams.get("search");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const where: Prisma.InvoiceWhereInput = {};

    if (status) where.status = status as InvoiceStatus;

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
          booking: { select: { id: true, bookingId: true, tripType: true, vehicleType: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { [safeSortField(sortBy, INVOICE_SORT_FIELDS)]: sortOrder },
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

// POST /api/invoices - Create invoice from booking (admin + driver)
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

    // Fetch booking + settings in parallel (outside transaction for early validation)
    const [booking, settings] = await Promise.all([
      prisma.booking.findUnique({
        where: { id: data.bookingId },
        include: { customer: true },
      }),
      prisma.settings.findUnique({ where: { id: "app_settings" } }),
    ]);

    if (!booking) return errorResponse("Booking not found", 404);

    // Driver can only create invoices for their own bookings
    const role = (session.user as { role: string }).role;
    if (role === "DRIVER" && booking.driverId !== session.user.id) {
      return errorResponse("Access denied", 403);
    }

    if (!booking.baseFare || !booking.totalAmount) {
      return errorResponse("Booking pricing must be set before creating an invoice", 400);
    }

    if (!settings) {
      return errorResponse("Company settings not configured. Please configure settings first.", 400);
    }

    // Calculate GST
    const subtotal = Number(booking.baseFare);
    const isInterState = data.isInterState ?? false;
    const includeGst = booking.includeGst;
    const gst = includeGst
      ? calculateGst(subtotal, isInterState)
      : { subtotal, cgstRate: 0, sgstRate: 0, igstRate: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalTax: 0 };

    const tollCharges = Number(booking.tollCharges || 0);
    const parkingCharges = Number(booking.parkingCharges || 0);
    const driverAllowance = Number(booking.driverAllowance || 0);
    const extraCharges = Number(booking.extraCharges || 0);
    const discount = Number(booking.discount || 0);
    const grandTotal = subtotal + gst.totalTax + tollCharges + parkingCharges + driverAllowance + extraCharges - discount;

    const dueDate = data.dueDate || new Date(
      Date.now() + (settings.defaultPaymentDueDays || 7) * 24 * 60 * 60 * 1000
    );

    const serviceDescription = data.serviceDescription ||
      `Transportation service - ${booking.pickupLocation} to ${booking.dropLocation}`;

    // Wrap invoice number generation + creation in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Generate invoice number atomically
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

      // Get amount already paid
      const paidResult = await tx.payment.aggregate({
        where: { bookingId: data.bookingId },
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
          companyAddress: [settings.companyAddress, settings.companyCity, settings.companyState, settings.companyPincode]
            .filter(Boolean).join(", "),
          companyGstin: settings.companyGstin || "",
          companyPhone: settings.companyPhone || "",
          companyEmail: settings.companyEmail || "",
          companyState: settings.companyState || "",
          companyStateCode: settings.companyStateCode || "",

          customerName: booking.customer.name,
          customerAddress: [booking.customer.address, booking.customer.city, booking.customer.state, booking.customer.pincode]
            .filter(Boolean).join(", ") || null,
          customerPhone: booking.customer.phone,
          customerEmail: booking.customer.email || null,
          customerGstin: booking.customer.gstin || null,
          customerState: booking.customer.state || null,

          serviceDescription,
          sacCode: settings.defaultSacCode || "9964",

          subtotal,
          cgstRate: gst.cgstRate,
          sgstRate: gst.sgstRate,
          igstRate: gst.igstRate,
          cgstAmount: gst.cgstAmount,
          sgstAmount: gst.sgstAmount,
          igstAmount: gst.igstAmount,
          totalTax: gst.totalTax,
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
