import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// GET /api/invoices/public/[token] - Public: fetch invoice by share token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        dueDate: true,
        companyName: true,
        companyAddress: true,
        companyPhone: true,
        companyEmail: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        serviceDescription: true,
        subtotal: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
        totalTax: true,
        tollCharges: true,
        parkingCharges: true,
        driverAllowance: true,
        extraCharges: true,
        extraChargesNote: true,
        discount: true,
        grandTotal: true,
        amountInWords: true,
        amountPaid: true,
        balanceDue: true,
        signatureData: true,
        signedAt: true,
        booking: {
          select: {
            bookingId: true,
            pickupLocation: true,
            dropLocation: true,
            travelDate: true,
            vehicleType: true,
            tripType: true,
          },
        },
      },
    });

    if (!invoice) return errorResponse("Invoice not found", 404);

    // Fetch bank details
    const settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
      select: {
        bankName: true,
        bankAccountNumber: true,
        bankIfscCode: true,
        bankAccountName: true,
        upiId: true,
      },
    });

    return successResponse({
      ...invoice,
      subtotal: Number(invoice.subtotal),
      cgstAmount: Number(invoice.cgstAmount),
      sgstAmount: Number(invoice.sgstAmount),
      igstAmount: Number(invoice.igstAmount),
      totalTax: Number(invoice.totalTax),
      tollCharges: Number(invoice.tollCharges),
      parkingCharges: Number(invoice.parkingCharges),
      driverAllowance: Number(invoice.driverAllowance),
      extraCharges: Number(invoice.extraCharges),
      discount: Number(invoice.discount),
      grandTotal: Number(invoice.grandTotal),
      amountPaid: Number(invoice.amountPaid),
      balanceDue: Number(invoice.balanceDue),
      bankDetails: settings,
    });
  } catch (error) {
    console.error("Public invoice error:", error);
    return errorResponse("Failed to fetch invoice", 500);
  }
}
