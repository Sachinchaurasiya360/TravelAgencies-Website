import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSettingsSchema } from "@/validators/settings.validator";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// GET /api/settings - Get application settings (admin only)
export async function GET() {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    // Get or create the singleton settings record
    let settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: "app_settings" },
      });
    }

    return successResponse(settings);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return errorResponse("Failed to fetch settings", 500);
  }
}

// PATCH /api/settings - Update application settings (admin only)
export async function PATCH(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;

    // Upsert to ensure the settings record exists
    const settings = await prisma.settings.upsert({
      where: { id: "app_settings" },
      update: data,
      create: {
        id: "app_settings",
        ...data,
      },
    });

    logActivity({
      action: ActivityAction.SETTINGS_UPDATED,
      description: "Application settings updated",
      userId: session.user.id,
      entityType: "Settings",
      entityId: "app_settings",
      metadata: { updatedFields: Object.keys(data) },
    }).catch(console.error);

    return successResponse(settings);
  } catch (error) {
    console.error("Settings update error:", error);
    return errorResponse("Failed to update settings", 500);
  }
}
