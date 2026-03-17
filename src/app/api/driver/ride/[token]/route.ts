import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// GET /api/driver/ride/[token] - Public: fetch booking by driver access token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { driverAccessToken: token },
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            grandTotal: true,
            signedAt: true,
            shareToken: true,
          },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          select: {
            id: true,
            receiptNumber: true,
            amount: true,
            method: true,
            paymentDate: true,
            isAdvance: true,
          },
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!booking) return errorResponse("Ride not found", 404);

    return successResponse(booking);
  } catch (error) {
    console.error("Driver ride token error:", error);
    return errorResponse("Failed to fetch ride", 500);
  }
}
