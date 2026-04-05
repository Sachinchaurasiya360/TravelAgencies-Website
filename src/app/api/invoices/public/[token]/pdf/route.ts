import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceHtml } from "@/services/pdf.service";

// GET /api/invoices/public/[token]/pdf - Public PDF via share token (no auth)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const [invoice, settings] = await Promise.all([
      prisma.invoice.findUnique({
        where: { shareToken: token },
        include: {
          booking: {
            select: {
              estimatedDistance: true,
              actualDistance: true,
              startKm: true,
              endKm: true,
              startDateTime: true,
              endDateTime: true,
              driverId: true,
              travelDate: true,
              pickupLocation: true,
              dropLocation: true,
              vehiclePreference: true,
              dutySlip: { select: { signatureData: true, signedAt: true, vehicleNumber: true, vehicleName: true } },
            },
          },
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

    if (!invoice) {
      return new Response("Invoice not found", { status: 404 });
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
      termsAndConditions: invoice.termsAndConditions,
      bankName: settings?.bankName,
      bankAccountNumber: settings?.bankAccountNumber,
      bankIfscCode: settings?.bankIfscCode,
      bankAccountName: settings?.bankAccountName,
      upiId: settings?.upiId,
      estimatedDistance: invoice.booking.estimatedDistance,
      actualDistance: invoice.booking.actualDistance,
      startKm: invoice.booking.startKm,
      endKm: invoice.booking.endKm,
      startDateTime: invoice.booking.startDateTime,
      endDateTime: invoice.booking.endDateTime,
      signatureData: invoice.signatureData,
      signedAt: invoice.signedAt,
      dutySlipSignatureData: invoice.booking.dutySlip?.signatureData,
      dutySlipSignedAt: invoice.booking.dutySlip?.signedAt,
      vehicleNumber: invoice.booking.dutySlip?.vehicleNumber,
      vehicleName: invoice.booking.dutySlip?.vehicleName || invoice.booking.vehiclePreference,
      travelDate: invoice.booking.travelDate,
      pickupLocation: invoice.booking.pickupLocation,
      dropLocation: invoice.booking.dropLocation,
    });

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("Public invoice PDF error:", error);
    return new Response("Failed to generate invoice", { status: 500 });
  }
}
