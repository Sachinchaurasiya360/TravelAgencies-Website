import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSettingsSchema } from "@/validators/settings.validator";
import { successResponse, errorResponse, requireAdmin } from "@/lib/api-helpers";
import { ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// GET /api/settings - Get application settings (admin only)
export async function GET() {
  const session = await requireAdmin();
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
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();

    // Strip null values — the DB returns nulls but Zod expects string | undefined
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== null) cleaned[key] = value;
    }

    const parsed = updateSettingsSchema.safeParse(cleaned);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join(".");
      return errorResponse(
        field ? `${field}: ${issue.message}` : issue.message,
        400
      );
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
