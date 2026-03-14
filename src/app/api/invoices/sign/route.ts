import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { signInvoiceSchema } from "@/validators/invoice.validator";
import { sendEmail } from "@/services/email.service";
import { formatCurrency } from "@/lib/helpers/currency";

// POST /api/invoices/sign - Public: submit customer signature
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { token, signatureData } = parsed.data;

    const invoice = await prisma.invoice.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        signedAt: true,
        invoiceNumber: true,
        grandTotal: true,
        customerName: true,
        customerEmail: true,
        companyName: true,
        bookingId: true,
        booking: {
          select: {
            bookingId: true,
            pickupLocation: true,
            dropLocation: true,
            travelDate: true,
            driver: { select: { name: true, phone: true } },
          },
        },
      },
    });

    if (!invoice) return errorResponse("Invoice not found", 404);

    if (invoice.signedAt) {
      return errorResponse("This invoice has already been signed", 400);
    }

    // Validate signature is a valid data URI (base64 image)
    if (!signatureData.startsWith("data:image/")) {
      return errorResponse("Invalid signature format", 400);
    }
    if (signatureData.length > 500_000) {
      return errorResponse("Signature data too large", 400);
    }

    // Conditional update to prevent race condition: only update if not already signed
    const updated = await prisma.invoice.updateMany({
      where: { id: invoice.id, signedAt: null },
      data: {
        signatureData,
        signedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return errorResponse("This invoice has already been signed", 400);
    }

    // Mark the booking as completed
    await prisma.booking.update({
      where: { id: invoice.bookingId },
      data: { status: "COMPLETED" },
    });

    // Send thank-you email if customer has email
    if (invoice.customerEmail) {
      const travelDate = new Date(invoice.booking.travelDate).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      });

      const driverSection = invoice.booking.driver
        ? `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Driver Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.booking.driver.name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Driver Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.booking.driver.phone}</td></tr>`
        : "";

      sendEmail({
        to: invoice.customerEmail,
        subject: `Thank You - Invoice ${invoice.invoiceNumber} Signed | ${invoice.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">${invoice.companyName}</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #333;">Thank You, ${invoice.customerName}!</h2>
              <p>We have received your signed invoice. Thank you for choosing ${invoice.companyName} for your travel needs.</p>

              <h3 style="color: #666; font-size: 14px; margin-top: 24px;">Trip Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Booking ID</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">#${invoice.booking.bookingId}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Invoice</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.invoiceNumber}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Pickup</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.booking.pickupLocation}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Drop</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.booking.dropLocation}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Travel Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${travelDate}</td></tr>
                ${driverSection}
                <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Total Amount</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #2563eb;">${formatCurrency(invoice.grandTotal)}</td></tr>
              </table>

              <p style="margin-top: 20px;">We hope you had a great experience. Looking forward to serving you again!</p>
              <p style="font-weight: bold;">Warm regards,<br>${invoice.companyName}</p>

              <p style="color: #999; font-size: 11px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 12px;">
                This is an automated email. If you have any questions, please contact us at +91 74981 25466.
              </p>
            </div>
          </div>
        `,
      }).catch((err) => console.error("Thank-you email error:", err));
    }

    return successResponse({ message: "Invoice signed successfully" });
  } catch (error) {
    console.error("Sign invoice error:", error);
    return errorResponse("Failed to sign invoice", 500);
  }
}
