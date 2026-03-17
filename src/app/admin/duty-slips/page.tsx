"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate } from "@/lib/helpers/date";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import {
  Search,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

interface DutySlip {
  id: string;
  status: string;
  guestName: string;
  vehicleName: string | null;
  vehicleNumber: string | null;
  officeStartKm: number | null;
  customerEndKm: number | null;
  submittedAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    bookingId: string;
    travelDate: string;
  };
  driver: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function DutySlipsPage() {
  const t = useT();
  const [dutySlips, setDutySlips] = useState<DutySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDutySlips = useCallback(async () => {
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

      const res = await fetch(`/api/duty-slips?${params}`);
      const result = await res.json();

      if (result.success) {
        setDutySlips(result.data.dutySlips);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch {
      toast.error("Failed to fetch duty slips");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchDutySlips();
  }, [fetchDutySlips]);

  function getTotalKm(slip: DutySlip) {
    if (slip.officeStartKm != null && slip.customerEndKm != null) {
      return (slip.customerEndKm - slip.officeStartKm).toLocaleString("en-IN") + " km";
    }
    return "—";
  }

  if (loading && dutySlips.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.nav.dutySlips}
        description={t.dutySlip.title}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by booking ID, guest, driver, vehicle..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">{t.dutySlip.pending}</SelectItem>
            <SelectItem value="SUBMITTED">{t.dutySlip.submitted}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {dutySlips.length === 0 && !loading ? (
        <EmptyState
          icon={ClipboardList}
          title="No duty slips found"
          description="Duty slips are created when a driver is assigned to a booking."
        />
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {dutySlips.map((slip) => (
              <Card key={slip.id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Link
                      href={`/admin/bookings/${slip.booking.id}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {slip.booking.bookingId}
                    </Link>
                    <Badge variant={slip.status === "SUBMITTED" ? "default" : "secondary"}>
                      {slip.status === "SUBMITTED" ? t.dutySlip.submitted : t.dutySlip.pending}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground space-y-1 text-sm">
                    <p>Guest: <span className="text-foreground font-medium">{slip.guestName}</span></p>
                    <p>Driver: <span className="text-foreground font-medium">{slip.driver.name}</span></p>
                    {slip.vehicleName && (
                      <p>Vehicle: <span className="text-foreground font-medium">{slip.vehicleName} {slip.vehicleNumber && `(${slip.vehicleNumber})`}</span></p>
                    )}
                    <p>Total KM: <span className="text-foreground font-medium">{getTotalKm(slip)}</span></p>
                    <p>Travel: <span className="text-foreground font-medium">{formatDate(slip.booking.travelDate)}</span></p>
                    {slip.submittedAt && (
                      <p>Submitted: <span className="text-foreground font-medium">{formatDate(slip.submittedAt)}</span></p>
                    )}
                  </div>
                  <div className="mt-3">
                    <Link href={`/admin/bookings/${slip.booking.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View Booking
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-4 py-3 text-left font-medium">Booking</th>
                        <th className="px-4 py-3 text-left font-medium">Guest</th>
                        <th className="px-4 py-3 text-left font-medium">Driver</th>
                        <th className="px-4 py-3 text-left font-medium">Vehicle</th>
                        <th className="px-4 py-3 text-left font-medium">Total KM</th>
                        <th className="px-4 py-3 text-left font-medium">Travel Date</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">{t.common.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dutySlips.map((slip) => (
                        <tr key={slip.id} className="hover:bg-muted/30 border-b last:border-0">
                          <td className="px-4 py-3">
                            <Link href={`/admin/bookings/${slip.booking.id}`} className="font-medium text-blue-600 hover:underline">
                              {slip.booking.bookingId}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{slip.guestName}</td>
                          <td className="px-4 py-3">
                            <div>{slip.driver.name}</div>
                            <div className="text-muted-foreground text-xs">{slip.driver.phone}</div>
                          </td>
                          <td className="px-4 py-3">
                            {slip.vehicleName ? (
                              <div>
                                <div>{slip.vehicleName}</div>
                                {slip.vehicleNumber && <div className="text-muted-foreground text-xs">{slip.vehicleNumber}</div>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">{getTotalKm(slip)}</td>
                          <td className="px-4 py-3">{formatDate(slip.booking.travelDate)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={slip.status === "SUBMITTED" ? "default" : "secondary"}>
                              {slip.status === "SUBMITTED" ? t.dutySlip.submitted : t.dutySlip.pending}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/admin/bookings/${slip.booking.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                {interpolate(t.common.pageOf, { page, total: totalPages })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t.common.prev}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t.common.next}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
