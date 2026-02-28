import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";
import { z } from "zod";

const addNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(5000),
});

// POST /api/bookings/[id]/notes - Add admin note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = addNoteSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return errorResponse("Booking not found", 404);

    const note = await prisma.bookingNote.create({
      data: {
        bookingId: id,
        userId: session.user.id,
        content: parsed.data.content,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    logActivity({
      action: ActivityAction.BOOKING_NOTE_ADDED,
      description: `Note added to booking ${booking.bookingId}`,
      userId: session.user.id,
      entityType: "Booking",
      entityId: booking.id,
      metadata: { bookingId: booking.bookingId, noteId: note.id },
    }).catch(console.error);

    return successResponse(note, 201);
  } catch (error) {
    console.error("Add note error:", error);
    return errorResponse("Failed to add note", 500);
  }
}
