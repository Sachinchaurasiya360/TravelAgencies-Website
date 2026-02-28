import { prisma } from "@/lib/prisma";
import { ActivityAction, Prisma } from "@prisma/client";

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
  } catch (error) {
    // Fire-and-forget: log to console but don't throw
    console.error("Activity log error:", error);
  }
}
