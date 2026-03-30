import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { generateWhatsAppUrl } from "@/services/whatsapp.service";
import { randomUUID } from "crypto";

// POST /api/invoices/[id]/share - Generate share link + WhatsApp URL
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            bookingId: true,
            driverId: true,
            pickupLocation: true,
            dropLocation: true,
            travelDate: true,
            pickupTime: true,
            driver: { select: { name: true, vehicleNumber: true, vehicleName: true } },
          },
        },
        customer: { select: { phone: true, name: true } },
      },
    });

    if (!invoice) return errorResponse("Invoice not found", 404);

    // Driver can only share invoices for their own bookings
    const role = (session.user as { role: string }).role;
    if (role === "DRIVER" && invoice.booking.driverId !== session.user.id) {
      return errorResponse("Access denied", 403);
    }

    // Generate or reuse existing share token (atomic to prevent race condition)
    let shareToken = invoice.shareToken;
    if (!shareToken) {
      shareToken = randomUUID();
      // Use updateMany with condition to prevent two concurrent requests generating different tokens
      const result = await prisma.invoice.updateMany({
        where: { id, shareToken: null },
        data: { shareToken },
      });
      // If another request already set a token, re-fetch
      if (result.count === 0) {
        const refreshed = await prisma.invoice.findUnique({
          where: { id },
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

    const travelDate = new Date(invoice.booking.travelDate).toLocaleDateString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    const pickupTime = invoice.booking.pickupTime || "-";
    const from = invoice.booking.pickupLocation;
    const to = invoice.booking.dropLocation;
    const carNo = invoice.booking.driver?.vehicleNumber || invoice.booking.driver?.vehicleName || "-";
    const driverInfo = invoice.booking.driver?.name || "-";

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
    console.error("Share invoice error:", error);
    return errorResponse("Failed to share invoice", 500);
  }
}
