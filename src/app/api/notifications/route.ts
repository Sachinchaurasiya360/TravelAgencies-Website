import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, NotificationType, NotificationStatus, NotificationChannel } from "@prisma/client";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";

// GET /api/notifications - List notification logs (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);

    const type = searchParams.get("type") as NotificationType | null;
    const status = searchParams.get("status") as NotificationStatus | null;
    const channel = searchParams.get("channel") as NotificationChannel | null;
    const bookingId = searchParams.get("bookingId");
    const search = searchParams.get("search");

    const where: Prisma.NotificationLogWhereInput = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (channel) where.channel = channel;
    if (bookingId) where.bookingId = bookingId;

    if (search) {
      where.OR = [
        { recipientPhone: { contains: search } },
        { recipientEmail: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { booking: { bookingId: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [notifications, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        include: {
          booking: {
            select: {
              bookingId: true,
              customer: { select: { id: true, name: true, phone: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.notificationLog.count({ where }),
    ]);

    return successResponse({
      notifications,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Notifications list error:", error);
    return errorResponse("Failed to fetch notifications", 500);
  }
}
