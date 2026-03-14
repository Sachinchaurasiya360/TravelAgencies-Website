"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/helpers/currency";
import { ArrowLeft, IndianRupee, Receipt, Car, Filter } from "lucide-react";
import { useT } from "@/lib/i18n/language-context";

interface RevenueSummary {
  totalRevenue: string | number;
  totalPaymentsCount: number;
  totalBookingValue: string | number;
  totalTax: string | number;
  bookingCount: number;
}

interface VehicleBreakdown {
  vehicleType: string | null;
  totalAmount: string | number;
  taxAmount: string | number;
  count: number;
}

interface RevenueData {
  summary: RevenueSummary;
  byVehicleType: VehicleBreakdown[];
  filters: { fromDate: string | null; toDate: string | null };
}

export default function RevenueReportPage() {
  const t = useT();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function fetchData(from?: string, to?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("fromDate", from);
      if (to) params.set("toDate", to);
      const res = await fetch(`/api/reports/revenue?${params}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch {
      toast.error(t.revenueReport.fetchFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    fetchData(fromDate, toDate);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.revenueReport.title}
        description={t.revenueReport.subtitle}
      >
        <Button variant="outline" asChild>
          <Link href="/admin/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.common.back}
          </Link>
        </Button>
      </PageHeader>

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
            <div>
              <Label htmlFor="fromDate">{t.revenueReport.fromDate}</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="toDate">{t.revenueReport.toDate}</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              {t.revenueReport.applyFilter}
            </Button>
            {(fromDate || toDate) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  fetchData();
                }}
              >
                {t.common.clear}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.revenueReport.totalRevenue}</CardTitle>
                <IndianRupee className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.totalRevenue)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {data.summary.totalPaymentsCount} {t.revenueReport.paymentsReceived}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.revenueReport.bookingValue}</CardTitle>
                <Receipt className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.summary.totalBookingValue)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {data.summary.bookingCount} {t.revenueReport.confirmedBookings}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.revenueReport.taxCollected}</CardTitle>
                <IndianRupee className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(data.summary.totalTax)}
                </div>
                <p className="text-muted-foreground text-xs">{t.revenueReport.gstCollected}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.revenueReport.bookingsLabel}</CardTitle>
                <Car className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.bookingCount}
                </div>
                <p className="text-muted-foreground text-xs">{t.revenueReport.confirmedTrips}</p>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Type Breakdown */}
          {data.byVehicleType.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.revenueReport.revenueByVehicle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b text-left">
                        <th className="p-3 font-medium">{t.revenueReport.vehicleType}</th>
                        <th className="p-3 font-medium text-right">{t.revenueReport.bookings}</th>
                        <th className="p-3 font-medium text-right">{t.revenueReport.revenue}</th>
                        <th className="p-3 font-medium text-right">{t.revenueReport.tax}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byVehicleType.map((item) => (
                        <tr
                          key={item.vehicleType || "unknown"}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="p-3 font-medium">
                            {item.vehicleType || t.revenueReport.notSpecified}
                          </td>
                          <td className="p-3 text-right">{item.count}</td>
                          <td className="p-3 text-right">
                            {formatCurrency(item.totalAmount)}
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrency(item.taxAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
