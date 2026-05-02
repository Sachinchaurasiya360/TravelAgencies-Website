"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDate } from "@/lib/helpers/date";
import { BOOKING_STATUSES } from "@/lib/constants";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { getStatusLabel } from "@/lib/i18n/label-maps";
import { Search, CalendarCheck, ChevronLeft, ChevronRight, Download } from "lucide-react";

const BOOKING_EXPORT_COLUMNS = [
  { key: "bookingId", label: "Booking ID" },
  { key: "customerName", label: "Customer" },
  { key: "customerPhone", label: "Phone" },
  { key: "customerEmail", label: "Email" },
  { key: "pickupLocation", label: "Pickup" },
  { key: "pickupAddress", label: "Pickup Address" },
  { key: "dropLocation", label: "Drop" },
  { key: "dropAddress", label: "Drop Address" },
  { key: "travelDate", label: "Travel Date" },
  { key: "returnDate", label: "Return Date" },
  { key: "pickupTime", label: "Pickup Time" },
  { key: "vehiclePreference", label: "Vehicle Preference" },
  { key: "carSource", label: "Car Source" },
  { key: "driverName", label: "Driver" },
  { key: "vendorName", label: "Vendor" },
  { key: "status", label: "Status" },
  { key: "baseFare", label: "Base Fare" },
  { key: "tollCharges", label: "Toll" },
  { key: "parkingCharges", label: "Parking" },
  { key: "driverAllowance", label: "Driver Allowance" },
  { key: "extraCharges", label: "Extra Charges" },
  { key: "discount", label: "Discount" },
  { key: "totalAmount", label: "Total" },
  { key: "advanceAmount", label: "Advance" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "specialRequests", label: "Special Requests" },
  { key: "adminRemarks", label: "Admin Remarks" },
  { key: "createdAt", label: "Created At" },
];

const DEFAULT_EXPORT_COLUMNS = [
  "bookingId",
  "customerName",
  "customerPhone",
  "pickupLocation",
  "dropLocation",
  "travelDate",
  "status",
  "totalAmount",
  "paymentStatus",
];

interface Booking {
  id: string;
  bookingId: string;
  status: string;
  travelDate: string;
  paymentStatus: string;
  totalAmount: string | null;
  customer: { id: string; name: string; phone: string; email: string | null };
}

export default function BookingsPage() {
  const t = useT();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportDateMode, setExportDateMode] = useState<"all" | "month" | "custom">("all");
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [exportColumns, setExportColumns] = useState<string[]>(DEFAULT_EXPORT_COLUMNS);

  const getExportDateRange = () => {
    if (exportDateMode === "month") {
      const [year, month] = exportMonth.split("-").map(Number);
      const fromDate = `${exportMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate().toString().padStart(2, "0");
      const toDate = `${exportMonth}-${lastDay}`;
      return { fromDate, toDate };
    }

    if (exportDateMode === "custom") {
      return {
        fromDate: exportFromDate || undefined,
        toDate: exportToDate || undefined,
      };
    }

    return {};
  };

  const toggleExportColumn = (key: string, checked: boolean) => {
    setExportColumns((current) =>
      checked ? [...current, key] : current.filter((value) => value !== key)
    );
  };

  const handleExport = async () => {
    if (exportColumns.length === 0) {
      toast.error("Select at least one column to export");
      return;
    }

    setExporting(true);
    try {
      const filters: Record<string, string> = {};
      if (search) filters.search = search;
      if (statusFilter !== "all") filters.status = statusFilter;
      const dateRange = getExportDateRange();
      if (dateRange.fromDate) filters.fromDate = dateRange.fromDate;
      if (dateRange.toDate) filters.toDate = dateRange.toDate;

      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bookings", filters, columns: exportColumns }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t.bookings.exportDownloaded);
    } catch {
      toast.error(t.bookings.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/bookings?${params}`);
      const result = await res.json();

      if (result.success) {
        setBookings(result.data.bookings);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch {
      toast.error(t.bookings.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.bookings.title}</h1>
          <p className="text-muted-foreground">{t.bookings.subtitle}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => (exportOpen ? handleExport() : setExportOpen(true))}
          disabled={exporting}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? t.common.exporting : t.bookings.exportExcel}
        </Button>
      </div>

      {exportOpen && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Date Range</Label>
                <Select value={exportDateMode} onValueChange={(value) => setExportDateMode(value as "all" | "month" | "custom")}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All dates</SelectItem>
                    <SelectItem value="month">Choose month</SelectItem>
                    <SelectItem value="custom">Custom dates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportDateMode === "month" && (
                <div>
                  <Label htmlFor="exportMonth">Month</Label>
                  <Input
                    id="exportMonth"
                    type="month"
                    value={exportMonth}
                    onChange={(event) => setExportMonth(event.target.value)}
                    className="mt-1"
                  />
                </div>
              )}

              {exportDateMode === "custom" && (
                <>
                  <div>
                    <Label htmlFor="exportFromDate">From Date</Label>
                    <Input
                      id="exportFromDate"
                      type="date"
                      value={exportFromDate}
                      onChange={(event) => setExportFromDate(event.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exportToDate">To Date</Label>
                    <Input
                      id="exportToDate"
                      type="date"
                      value={exportToDate}
                      onChange={(event) => setExportToDate(event.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <Label>Columns to Export</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExportColumns(BOOKING_EXPORT_COLUMNS.map((column) => column.key))}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExportColumns(DEFAULT_EXPORT_COLUMNS)}
                  >
                    Default
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {BOOKING_EXPORT_COLUMNS.map((column) => (
                  <label key={column.key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={exportColumns.includes(column.key)}
                      onCheckedChange={(checked) => toggleExportColumn(column.key, checked === true)}
                    />
                    <span>{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleExport} disabled={exporting || exportColumns.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? t.common.exporting : t.bookings.exportExcel}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t.bookings.searchPlaceholder}
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.bookings.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.bookings.allStatuses}</SelectItem>
                {BOOKING_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {getStatusLabel(t, value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title={t.bookings.noBookingsFound}
              description={t.bookings.noBookingsMatch}
            />
          ) : (
            <>
              {/* Mobile card view */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {bookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-blue-600">
                          #{booking.bookingId}
                        </span>
                        <StatusBadge status={booking.status} label={getStatusLabel(t, booking.status)} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {booking.totalAmount
                          ? formatCurrency(booking.totalAmount)
                          : "-"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {booking.customer.name}
                      </p>
                      <p className="text-xs text-gray-400 shrink-0 ml-2">
                        {formatDate(booking.travelDate)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-4 font-medium">{t.bookings.bookingId}</th>
                      <th className="p-4 font-medium">{t.bookings.customer}</th>
                      <th className="p-4 font-medium">{t.bookings.travelDate}</th>
                      <th className="p-4 font-medium">{t.bookings.status}</th>
                      <th className="p-4 font-medium">{t.bookings.payment}</th>
                      <th className="p-4 font-medium">{t.bookings.amount}</th>
                      <th className="p-4 font-medium">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            #{booking.bookingId}
                          </Link>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{booking.customer.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {booking.customer.phone}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          {formatDate(booking.travelDate)}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={booking.status} label={getStatusLabel(t, booking.status)} />
                        </td>
                        <td className="p-4">
                          <StatusBadge status={booking.paymentStatus} label={getStatusLabel(t, booking.paymentStatus)} />
                        </td>
                        <td className="p-4 font-medium">
                          {booking.totalAmount
                            ? formatCurrency(booking.totalAmount)
                            : "-"}
                        </td>
                        <td className="p-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/bookings/${booking.id}`}>
                              {t.common.view}
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t p-4">
                <p className="text-muted-foreground text-sm">
                  {interpolate(t.common.pageOf, { page, total: totalPages })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t.common.prev}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    {t.common.next}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
