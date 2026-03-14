export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { DashboardView } from "@/components/admin/dashboard-view";

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [
    todayBookings,
    pendingCount,
    monthlyRevenue,
    upcomingTripsCount,
    recentBookings,
    totalBookings,
  ] = await Promise.all([
    prisma.booking.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.booking.count({
      where: { status: "PENDING" },
    }),
    prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: startOfMonth },
        status: "CONFIRMED",
      },
    }),
    prisma.booking.count({
      where: {
        travelDate: { gte: today, lte: nextWeek },
        status: "CONFIRMED",
      },
    }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
      },
    }),
    prisma.booking.count(),
  ]);

  return {
    todayBookings,
    pendingCount,
    monthlyRevenue: monthlyRevenue._sum.totalAmount?.toString() || "0",
    upcomingTrips: upcomingTripsCount,
    totalBookings,
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      bookingId: b.bookingId,
      status: b.status,
      travelDate: b.travelDate.toISOString(),
      totalAmount: b.totalAmount?.toString() ?? null,
      customer: b.customer,
    })),
  };
}

export default async function AdminDashboard() {
  const data = await getDashboardData();

  return <DashboardView data={data} />;
}
