import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireAuth } from "@/lib/api-helpers";
import { generateInvoiceHtml } from "@/services/pdf.service";

// GET /api/invoices/[id]/pdf - Generate printable HTML invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    // Parallelize invoice + settings queries (independent)
    const [invoice, settings] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id },
        include: {
          booking: {
            select: {
              bookingId: true,
              tripType: true,
              vehicleType: true,
              travelDate: true,
              returnDate: true,
              pickupLocation: true,
              dropLocation: true,
              passengerCount: true,
              estimatedDistance: true,
              driverId: true,
            },
          },
          customer: true,
          payments: { orderBy: { paymentDate: "desc" } },
        },
      }),
      prisma.settings.findUnique({
        where: { id: "app_settings" },
        select: {
          bankName: true,
          bankAccountNumber: true,
          bankIfscCode: true,
          bankAccountName: true,
          upiId: true,
        },
      }),
    ]);

    if (!invoice) return errorResponse("Invoice not found", 404);

    // Driver can only view PDF for their own bookings
    const role = (session.user as { role: string }).role;
    if (role === "DRIVER" && invoice.booking.driverId !== session.user.id) {
      return errorResponse("Access denied", 403);
    }

    const html = generateInvoiceHtml({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      companyName: invoice.companyName,
      companyAddress: invoice.companyAddress,
      companyGstin: invoice.companyGstin,
      companyPhone: invoice.companyPhone,
      companyEmail: invoice.companyEmail,
      companyState: invoice.companyState,
      companyStateCode: invoice.companyStateCode,
      customerName: invoice.customerName,
      customerAddress: invoice.customerAddress,
      customerPhone: invoice.customerPhone,
      customerEmail: invoice.customerEmail,
      customerGstin: invoice.customerGstin,
      serviceDescription: invoice.serviceDescription,
      sacCode: invoice.sacCode,
      subtotal: invoice.subtotal.toString(),
      cgstRate: invoice.cgstRate.toString(),
      sgstRate: invoice.sgstRate.toString(),
      igstRate: invoice.igstRate.toString(),
      cgstAmount: invoice.cgstAmount.toString(),
      sgstAmount: invoice.sgstAmount.toString(),
      igstAmount: invoice.igstAmount.toString(),
      totalTax: invoice.totalTax.toString(),
      tollCharges: invoice.tollCharges.toString(),
      parkingCharges: invoice.parkingCharges.toString(),
      driverAllowance: invoice.driverAllowance.toString(),
      extraCharges: invoice.extraCharges.toString(),
      extraChargesNote: invoice.extraChargesNote,
      discount: invoice.discount.toString(),
      grandTotal: invoice.grandTotal.toString(),
      amountInWords: invoice.amountInWords,
      amountPaid: invoice.amountPaid.toString(),
      balanceDue: invoice.balanceDue.toString(),
      isInterState: invoice.isInterState,
      termsAndConditions: invoice.termsAndConditions,
      bankName: settings?.bankName,
      bankAccountNumber: settings?.bankAccountNumber,
      bankIfscCode: settings?.bankIfscCode,
      bankAccountName: settings?.bankAccountName,
      upiId: settings?.upiId,
      estimatedDistance: invoice.booking.estimatedDistance,
      signatureData: invoice.signatureData,
      signedAt: invoice.signedAt,
    });

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("Invoice PDF generation error:", error);
    return errorResponse("Failed to generate invoice PDF", 500);
  }
}
