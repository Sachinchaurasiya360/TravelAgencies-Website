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
      toast.error("Failed to fetch revenue report");
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
        title="Revenue Report"
        description="Monthly and yearly revenue breakdown"
      >
        <Button variant="outline" asChild>
          <Link href="/admin/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
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
              Apply Filter
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
                Clear
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
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <IndianRupee className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.totalRevenue)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {data.summary.totalPaymentsCount} payments received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Booking Value</CardTitle>
                <Receipt className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.summary.totalBookingValue)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {data.summary.bookingCount} confirmed bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
                <IndianRupee className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(data.summary.totalTax)}
                </div>
                <p className="text-muted-foreground text-xs">GST collected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Bookings</CardTitle>
                <Car className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.bookingCount}
                </div>
                <p className="text-muted-foreground text-xs">Confirmed trips</p>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Type Breakdown */}
          {data.byVehicleType.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue by Vehicle Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b text-left">
                        <th className="p-3 font-medium">Vehicle Type</th>
                        <th className="p-3 font-medium text-right">Bookings</th>
                        <th className="p-3 font-medium text-right">Revenue</th>
                        <th className="p-3 font-medium text-right">Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byVehicleType.map((item) => (
                        <tr
                          key={item.vehicleType || "unknown"}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="p-3 font-medium">
                            {item.vehicleType || "Not specified"}
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
