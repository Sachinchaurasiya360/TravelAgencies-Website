import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireDriver } from "@/lib/api-helpers";

// GET /api/driver/bookings/[id] - Get single booking detail for driver
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireDriver();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const driverId = session.user.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
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

    if (!booking) return errorResponse("Booking not found", 404);

    // Verify this booking belongs to the driver
    if (booking.driverId !== driverId) {
      return errorResponse("Access denied", 403);
    }

    return successResponse(booking);
  } catch (error) {
    console.error("Driver booking detail error:", error);
    return errorResponse("Failed to fetch booking", 500);
  }
}
