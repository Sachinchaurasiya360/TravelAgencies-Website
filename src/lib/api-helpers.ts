import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  const role = (session.user as { role: string }).role;
  if (role === "DRIVER") {
    return null;
  }
  return session;
}

export async function requireDriver() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  const role = (session.user as { role: string }).role;
  if (role !== "DRIVER") {
    return null;
  }
  return session;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const rawOrder = searchParams.get("sortOrder");
  const sortOrder: "asc" | "desc" = rawOrder === "asc" ? "asc" : "desc";

  return { page, limit, skip, sortBy, sortOrder };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/** Returns sortBy if it's in the allowed list, otherwise falls back to "createdAt". */
export function safeSortField(sortBy: string, allowed: string[]): string {
  return allowed.includes(sortBy) ? sortBy : "createdAt";
}

/** Returns the value if it's a valid enum member, otherwise undefined. */
export function validEnumOrUndefined<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[] | T[]
): T | undefined {
  if (!value) return undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}
