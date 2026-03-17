import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { generateWhatsAppUrl } from "@/services/whatsapp.service";
import { randomUUID } from "crypto";

// POST /api/driver/ride/[token]/share - Public: share invoice via driver token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { driverAccessToken: token },
      select: { id: true, bookingId: true },
    });
    if (!booking) return errorResponse("Ride not found", 404);

    const body = await request.json();
    const invoiceId = body.invoiceId;
    if (!invoiceId) return errorResponse("invoiceId is required", 400);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: { select: { phone: true, name: true } },
      },
    });

    if (!invoice) return errorResponse("Invoice not found", 404);
    if (invoice.bookingId !== booking.id) {
      return errorResponse("Invoice does not belong to this booking", 400);
    }

    let shareToken = invoice.shareToken;
    if (!shareToken) {
      shareToken = randomUUID();
      const result = await prisma.invoice.updateMany({
        where: { id: invoiceId, shareToken: null },
        data: { shareToken },
      });
      if (result.count === 0) {
        const refreshed = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          select: { shareToken: true },
        });
        shareToken = refreshed?.shareToken || shareToken;
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/invoice/${shareToken}`;

    const message = `Hello ${invoice.customer.name}! 📄

Here is your invoice for Booking #${booking.bookingId}.

*Invoice:* ${invoice.invoiceNumber}
*Amount:* ₹${Number(invoice.grandTotal).toLocaleString("en-IN")}

Please review and sign the invoice here:
${shareUrl}

- Sarthak Tour and Travels`;

    const whatsappUrl = generateWhatsAppUrl(invoice.customer.phone, message);

    return successResponse({ shareUrl, whatsappUrl, shareToken });
  } catch (error) {
    console.error("Driver ride share error:", error);
    return errorResponse("Failed to share invoice", 500);
  }
}
