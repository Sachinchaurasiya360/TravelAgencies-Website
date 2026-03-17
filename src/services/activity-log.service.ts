import { prisma } from "@/lib/prisma";
import { ActivityAction, Prisma } from "@prisma/client";

const RETENTION_DAYS = 15;
let lastCleanup = 0;
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface LogParams {
  action: ActivityAction;
  description: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logActivity(params: LogParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: params.action,
        description: params.description,
        userId: params.userId || null,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        metadata: (params.metadata as Prisma.InputJsonValue) ?? Prisma.DbNull,
        ipAddress: params.ipAddress || null,
      },
    });

    // Periodically purge old activity logs (fire-and-forget)
    const now = Date.now();
    if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
      lastCleanup = now;
      const cutoff = new Date(now - RETENTION_DAYS * 24 * 60 * 60 * 1000);
      prisma.activityLog
        .deleteMany({ where: { createdAt: { lt: cutoff } } })
        .catch(() => {});
    }
  } catch (error) {
    // Fire-and-forget: log to console but don't throw
    console.error("Activity log error:", error);
  }
}
