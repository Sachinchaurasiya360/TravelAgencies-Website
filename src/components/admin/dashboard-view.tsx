"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDate } from "@/lib/helpers/date";
import {
  CalendarCheck,
  Clock,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  ClipboardList,
  MapPin,
  CheckCircle,
  Car,
} from "lucide-react";
import Link from "next/link";
import { DashboardActions } from "@/components/admin/dashboard-actions";
import { useT } from "@/lib/i18n/language-context";
import { getStatusLabel } from "@/lib/i18n/label-maps";

interface DashboardData {
  todayBookings: number;
  pendingCount: number;
  monthlyRevenue: string;
  upcomingTrips: number;
  totalBookings: number;
  recentBookings: {
    id: string;
    bookingId: string;
    status: string;
    travelDate: string;
    totalAmount: string | null;
    customer: { name: string; phone: string };
  }[];
  upcomingDutySlips: {
    id: string;
    status: string;
    guestName: string;
    vehicleName: string | null;
    vehicleNumber: string | null;
    driverName: string;
    bookingId: string;
    bookingDbId: string;
    travelDate: string;
    pickupLocation: string;
    dropLocation: string;
  }[];
}

export function DashboardView({ data }: { data: DashboardData }) {
  const t = useT();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            {t.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t.dashboard.subtitle}
          </p>
        </div>
        <DashboardActions />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t.dashboard.todaysBookings}
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {data.todayBookings}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {data.totalBookings} {t.dashboard.totalLabel}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <CalendarCheck className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t.dashboard.pendingLabel}
                </p>
                <p className="mt-2 text-3xl font-semibold text-amber-600">
                  {data.pendingCount}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t.dashboard.awaitingReview}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t.dashboard.monthlyRevenue}
                </p>
                <p className="mt-2 text-3xl font-semibold text-emerald-600">
                  {formatCurrency(data.monthlyRevenue)}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t.dashboard.thisMonth}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t.dashboard.upcomingTrips}
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {data.upcomingTrips}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t.dashboard.next7Days}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Duty Slips */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <ClipboardList className="h-5 w-5 text-orange-500" />
            {t.dashboard.upcomingDutySlips}
          </CardTitle>
          <Link
            href="/admin/duty-slips"
            className="flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            {t.dashboard.viewAll}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {data.upcomingDutySlips.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">
              {t.dashboard.noDutySlips}
            </p>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {data.upcomingDutySlips.map((ds) => (
                  <Link
                    key={ds.id}
                    href={`/admin/bookings/${ds.bookingDbId}`}
                    className="block px-4 py-3 transition-colors hover:bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          #{ds.bookingId}
                        </span>
                        {ds.status === "SUBMITTED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
                            <CheckCircle className="h-3 w-3" />
                            {t.dutySlip.submitted}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-800">
                            {t.dutySlip.pending}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(ds.travelDate)}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{ds.guestName}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                      <Car className="h-3 w-3" />
                      <span>{ds.driverName}</span>
                      {ds.vehicleNumber && (
                        <span className="text-gray-300">· {ds.vehicleNumber}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        {t.dashboard.booking}
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        {t.dutySlip.guestName}
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        {t.dashboard.date}
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        {t.dutySlip.driverName}
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        {t.dashboard.route}
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        {t.dashboard.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.upcomingDutySlips.map((ds) => (
                      <tr
                        key={ds.id}
                        className="transition-colors hover:bg-gray-50/50"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/bookings/${ds.bookingDbId}`}
                            className="font-medium text-gray-900 hover:text-orange-600"
                          >
                            #{ds.bookingId}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-gray-900">
                          {ds.guestName}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">
                          {formatDate(ds.travelDate)}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-gray-900">{ds.driverName}</p>
                          {ds.vehicleNumber && (
                            <p className="text-xs text-gray-400">{[ds.vehicleName, ds.vehicleNumber].filter(Boolean).join(" · ")}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3 text-green-500" />
                            <span className="max-w-24 truncate">{ds.pickupLocation}</span>
                            <span className="text-gray-300">→</span>
                            <MapPin className="h-3 w-3 text-red-500" />
                            <span className="max-w-24 truncate">{ds.dropLocation}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {ds.status === "SUBMITTED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              <CheckCircle className="h-3 w-3" />
                              {t.dutySlip.submitted}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                              {t.dutySlip.pending}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-base font-semibold text-gray-900">
            {t.dashboard.recentBookings}
          </CardTitle>
          <Link
            href="/admin/bookings"
            className="flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            {t.dashboard.viewAll}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentBookings.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">
              {t.dashboard.noBookingsYet}
            </p>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {data.recentBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          #{booking.bookingId}
                        </span>
                        <StatusBadge status={booking.status} label={getStatusLabel(t, booking.status)} />
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600 truncate">
                        {booking.customer.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(booking.travelDate)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right pl-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.totalAmount
                          ? formatCurrency(booking.totalAmount)
                          : "-"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        {t.dashboard.booking}
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        {t.dashboard.customer}
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        {t.dashboard.date}
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                        {t.dashboard.status}
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                        {t.dashboard.amount}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="transition-colors hover:bg-gray-50/50"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="font-medium text-gray-900 hover:text-orange-600"
                          >
                            #{booking.bookingId}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900">
                            {booking.customer.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {booking.customer.phone}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">
                          {formatDate(booking.travelDate)}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={booking.status} label={getStatusLabel(t, booking.status)} />
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                          {booking.totalAmount
                            ? formatCurrency(booking.totalAmount)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
