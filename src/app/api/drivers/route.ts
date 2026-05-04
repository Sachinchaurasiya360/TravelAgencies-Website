import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAdmin, getPaginationParams, paginationMeta } from "@/lib/api-helpers";
import { createDriverUserSchema } from "@/validators/driver.validator";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

// GET /api/drivers - List drivers (users with DRIVER role)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const vendorId = searchParams.get("vendorId");

    const where: Prisma.UserWhereInput = { role: "DRIVER" };
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;
    if (vendorId) where.vendorId = vendorId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const [drivers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sortBy === "createdAt" ? sortBy : "name"]: sortOrder },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          vehicleName: true,
          vehicleNumber: true,
          vendorId: true,
          vendor: { select: { id: true, name: true, phone: true } },
          isActive: true,
          createdAt: true,
          _count: { select: { driverBookings: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse({
      drivers,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("Drivers list error:", error);
    return errorResponse("Failed to fetch drivers", 500);
  }
}

// POST /api/drivers - Create driver (user with DRIVER role)
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = createDriverUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const cleanPhone = parsed.data.phone.replace(/^\+91/, "");
    if (parsed.data.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: parsed.data.vendorId },
        select: { id: true, isActive: true },
      });
      if (!vendor) return errorResponse("Vendor not found", 404);
      if (!vendor.isActive) return errorResponse("Vendor is inactive", 400);
    }

    // Auto-generate placeholder email and password (drivers use token-based access, not login)
    const autoEmail = `driver-${randomUUID().slice(0, 8)}@placeholder.local`;
    const passwordHash = await hash(randomUUID(), 12);

    const driver = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: autoEmail,
        phone: cleanPhone,
        passwordHash,
        role: "DRIVER",
        vehicleName: parsed.data.vehicleName || null,
        vehicleNumber: parsed.data.vehicleNumber || null,
        vendorId: parsed.data.vendorId || null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        vehicleName: true,
        vehicleNumber: true,
        vendorId: true,
        vendor: { select: { id: true, name: true, phone: true } },
        isActive: true,
        createdAt: true,
      },
    });

    return successResponse(driver, 201);
  } catch (error) {
    console.error("Create driver error:", error);
    return errorResponse("Failed to create driver", 500);
  }
}
