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
      select: {
        id: true,
        bookingId: true,
        pickupLocation: true,
        dropLocation: true,
        travelDate: true,
        pickupTime: true,
        driver: { select: { name: true, vehicleNumber: true, vehicleName: true } },
      },
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

    const settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
      select: { companyName: true },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/invoice/${shareToken}`;
    const companyName = settings?.companyName || "Sarthak Unity Tours And Travels";

    const travelDate = new Date(booking.travelDate).toLocaleDateString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    const pickupTime = booking.pickupTime || "-";
    const from = booking.pickupLocation;
    const to = booking.dropLocation;
    const carNo = booking.driver?.vehicleNumber || booking.driver?.vehicleName || "-";
    const driverInfo = booking.driver?.name || "-";

    const message = `Dear ${invoice.customer.name},

Journey details
From: ${from} To ${to} On ${travelDate}
Invoice No: ${invoice.invoiceNumber}
Boarding: ${from} At ${pickupTime},
Address: ${from}

Car Details:-
Car No: ${carNo}
Driver details: ${driverInfo}

${companyName}
Your Travel Partner

Please review and sign your invoice here:
${shareUrl}`;

    const whatsappUrl = generateWhatsAppUrl(invoice.customer.phone, message);

    return successResponse({ shareUrl, whatsappUrl, shareToken });
  } catch (error) {
    console.error("Driver ride share error:", error);
    return errorResponse("Failed to share invoice", 500);
  }
}
