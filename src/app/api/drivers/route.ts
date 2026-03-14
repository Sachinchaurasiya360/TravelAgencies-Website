import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAdmin, getPaginationParams, paginationMeta } from "@/lib/api-helpers";
import { createDriverUserSchema } from "@/validators/driver.validator";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";

// GET /api/drivers - List drivers (users with DRIVER role)
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return errorResponse("Unauthorized", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(searchParams);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    const where: Prisma.UserWhereInput = { role: "DRIVER" };
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
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
          email: true,
          phone: true,
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

    const existingEmail = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existingEmail) {
      return errorResponse("A user with this email already exists", 400);
    }

    const passwordHash = await hash(parsed.data.password, 12);

    const driver = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: cleanPhone,
        passwordHash,
        role: "DRIVER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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
