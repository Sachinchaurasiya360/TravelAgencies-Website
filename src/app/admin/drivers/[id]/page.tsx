"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/helpers/currency";
import { useT } from "@/lib/i18n/language-context";
import { ArrowLeft, UserCheck, IndianRupee, MapPin, ChevronLeft, ChevronRight, Car } from "lucide-react";

export const dynamic = "force-dynamic";

interface DriverInfo {
  id: string;
  name: string;
  phone: string | null;
  vehicleName: string | null;
  vehicleNumber: string | null;
  isActive: boolean;
}

interface DriverBooking {
  id: string;
  bookingId: string;
  status: string;
  travelDate: string;
  pickupLocation: string;
  dropLocation: string;
  totalAmount: string | number | null;
  customer: { name: string; phone: string };
}

interface BookingsData {
  bookings: DriverBooking[];
  summary: { totalTrips: number; totalRevenue: string | number };
  pagination: { totalPages: number; currentPage: number; totalItems: number };
}

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [data, setData] = useState<BookingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const [driverRes, bookingsRes] = await Promise.all([
        fetch(`/api/drivers/${id}`),
        fetch(`/api/drivers/${id}/bookings?page=${p}&limit=20`),
      ]);
      const driverResult = await driverRes.json();
      const bookingsResult = await bookingsRes.json();

      if (driverResult.success) setDriver(driverResult.data);
      if (bookingsResult.success) setData(bookingsResult.data);
    } catch {
      toast.error(t.driverDetail.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [id, t.driverDetail.fetchFailed]);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  if (loading && !driver) return <LoadingSpinner />;
  if (!driver) return <div className="p-8 text-center text-muted-foreground">{t.driverDetail.fetchFailed}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={driver.name}
        description={`${driver.phone || ""}${driver.vehicleName ? ` | ${driver.vehicleName}` : ""}${driver.vehicleNumber ? ` (${driver.vehicleNumber})` : ""}`}
      >
        <div className="flex gap-2">
          <StatusBadge status={driver.isActive ? "ACTIVE" : "INACTIVE"} />
          <Button variant="outline" asChild>
            <Link href="/admin/drivers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.common.back}
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.driverDetail.totalTrips}</CardTitle>
              <Car className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalTrips}</div>
              <p className="text-muted-foreground text-xs">{t.driverDetail.tripsCompleted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.driverDetail.totalRevenue}</CardTitle>
              <IndianRupee className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(data.summary.totalRevenue)}
              </div>
              <p className="text-muted-foreground text-xs">{t.driverDetail.revenueGenerated}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.driverDetail.assignedBookings}</CardTitle>
        </CardHeader>
        <CardContent>
          {!data || data.bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t.driverDetail.noBookings}
            </p>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="divide-y sm:hidden">
                {data.bookings.map((b) => (
                  <div key={b.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Link href={`/admin/bookings/${b.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                        {b.bookingId}
                      </Link>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{b.customer.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {b.pickupLocation} → {b.dropLocation}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>{new Date(b.travelDate).toLocaleDateString("en-IN")}</span>
                      {b.totalAmount && (
                        <span className="font-medium text-green-600">{formatCurrency(b.totalAmount)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-3 font-medium">{t.driverDetail.bookingId}</th>
                      <th className="p-3 font-medium">{t.driverDetail.customer}</th>
                      <th className="p-3 font-medium">{t.driverDetail.travelDate}</th>
                      <th className="p-3 font-medium">{t.driverDetail.route}</th>
                      <th className="p-3 font-medium text-right">{t.driverDetail.totalAmount}</th>
                      <th className="p-3 font-medium">{t.driverDetail.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bookings.map((b) => (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-3">
                          <Link href={`/admin/bookings/${b.id}`} className="font-medium text-blue-600 hover:underline">
                            {b.bookingId}
                          </Link>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{b.customer.name}</p>
                          <p className="text-xs text-muted-foreground">{b.customer.phone}</p>
                        </td>
                        <td className="p-3">{new Date(b.travelDate).toLocaleDateString("en-IN")}</td>
                        <td className="p-3 text-muted-foreground">
                          {b.pickupLocation} → {b.dropLocation}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {b.totalAmount ? formatCurrency(b.totalAmount) : "-"}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    {t.common.page} {data.pagination.currentPage} / {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
