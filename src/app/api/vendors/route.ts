import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  requireAdmin,
  getPaginationParams,
  paginationMeta,
} from "@/lib/api-helpers";
import { createVendorSchema } from "@/validators/vendor.validator";
import { Prisma, ActivityAction } from "@prisma/client";
import { logActivity } from "@/services/activity-log.service";

// GET /api/vendors - List vendors
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } =
      getPaginationParams(searchParams);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    const where: Prisma.VendorWhereInput = {};
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        orderBy: {
          [sortBy === "createdAt" ? sortBy : "name"]: sortOrder,
        },
        skip,
        take: limit,
        include: { _count: { select: { bookings: true } } },
      }),
      prisma.vendor.count({ where }),
    ]);

    return successResponse({
      vendors,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Vendors list error:", error);
    return errorResponse("Failed to fetch vendors", 500);
  }
}

// POST /api/vendors - Create vendor
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = createVendorSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;
    const cleanPhone = data.phone.replace(/^\+91/, "");

    const vendor = await prisma.vendor.create({
      data: {
        name: data.name,
        phone: cleanPhone,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        vehicles: data.vehicles || null,
        rateInfo: data.rateInfo || null,
        notes: data.notes || null,
      },
    });

    logActivity({
      action: ActivityAction.VENDOR_CREATED,
      description: `Vendor "${vendor.name}" created`,
      userId: session.user.id,
      entityType: "Vendor",
      entityId: vendor.id,
    }).catch(console.error);

    return successResponse(vendor, 201);
  } catch (error) {
    console.error("Create vendor error:", error);
    return errorResponse("Failed to create vendor", 500);
  }
}
