import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { InvoiceStatus, ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// GET /api/invoices/[id] - Get invoice detail (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            bookingId: true,
            travelDate: true,
            pickupLocation: true,
            dropLocation: true,
          },
        },
        customer: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!invoice) return errorResponse("Invoice not found", 404);

    return successResponse(invoice);
  } catch (error) {
    console.error("Invoice detail error:", error);
    return errorResponse("Failed to fetch invoice", 500);
  }
}

// PATCH /api/invoices/[id] - Update invoice (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return errorResponse("Invoice not found", 404);

    // Only DRAFT invoices can be fully edited; ISSUED invoices can only change status
    const allowedStatusTransitions: Record<string, InvoiceStatus[]> = {
      [InvoiceStatus.DRAFT]: [InvoiceStatus.ISSUED, InvoiceStatus.CANCELLED],
      [InvoiceStatus.ISSUED]: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.VOID, InvoiceStatus.CANCELLED],
      [InvoiceStatus.PARTIALLY_PAID]: [InvoiceStatus.PAID, InvoiceStatus.VOID],
      [InvoiceStatus.PAID]: [],
      [InvoiceStatus.CANCELLED]: [],
      [InvoiceStatus.VOID]: [],
    };

    const updateData: Record<string, unknown> = {};

    // Status update
    if (body.status) {
      const allowed = allowedStatusTransitions[invoice.status] || [];
      if (!allowed.includes(body.status)) {
        return errorResponse(
          `Cannot transition invoice from ${invoice.status} to ${body.status}`,
          400
        );
      }
      updateData.status = body.status;
    }

    // Allow editing fields only for DRAFT invoices
    if (invoice.status === InvoiceStatus.DRAFT) {
      const editableFields = [
        "dueDate",
        "serviceDescription",
        "termsAndConditions",
        "notes",
        "placeOfSupply",
      ];

      for (const field of editableFields) {
        if (body[field] !== undefined) {
          if (field === "dueDate") {
            updateData[field] = new Date(body[field]);
          } else {
            updateData[field] = body[field];
          }
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid fields to update", 400);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    logActivity({
      action: updated.status === InvoiceStatus.CANCELLED
        ? ActivityAction.INVOICE_CANCELLED
        : ActivityAction.INVOICE_UPDATED,
      description: updated.status === InvoiceStatus.CANCELLED
        ? `Invoice ${invoice.id} cancelled`
        : `Invoice ${invoice.id} updated`,
      userId: session.user.id,
      entityType: "Invoice",
      entityId: updated.id,
      metadata: { invoiceId: updated.id, status: updated.status },
    }).catch(console.error);

    return successResponse(updated);
  } catch (error) {
    console.error("Invoice update error:", error);
    return errorResponse("Failed to update invoice", 500);
  }
}
