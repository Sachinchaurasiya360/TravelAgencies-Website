"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/helpers/currency";
import {
  ArrowLeft,
  AlertCircle,
  IndianRupee,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface OutstandingBooking {
  id: string;
  bookingId: string;
  customer: { id: string; name: string; phone: string; email: string | null };
  totalAmount: number;
  totalPaid: number;
  outstanding: number;
  paymentStatus: string;
  travelDate: string;
  paymentDueDate: string | null;
  lastPaymentDate: string | null;
  isOverdue: boolean;
}

interface OutstandingData {
  summary: {
    totalOutstanding: number;
    totalBookings: number;
    overdueCount: number;
    overdueAmount: number;
  };
  bookings: OutstandingBooking[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function OutstandingDuesPage() {
  const [data, setData] = useState<OutstandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "15" });
      const res = await fetch(`/api/reports/outstanding?${params}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch {
      toast.error("Failed to fetch outstanding dues");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outstanding Dues"
        description="Unpaid invoices and overdue payments"
      >
        <Button variant="outline" asChild>
          <Link href="/admin/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      {loading ? (
        <LoadingSpinner />
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                <IndianRupee className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(data.summary.totalOutstanding)}
                </div>
                <p className="text-muted-foreground text-xs">
                  Across {data.summary.totalBookings} bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.summary.overdueAmount)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {data.summary.overdueCount} overdue bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                <Clock className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalBookings}</div>
                <p className="text-muted-foreground text-xs">With pending payments</p>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-4 font-medium">Booking</th>
                      <th className="p-4 font-medium">Customer</th>
                      <th className="p-4 font-medium text-right">Total</th>
                      <th className="p-4 font-medium text-right">Paid</th>
                      <th className="p-4 font-medium text-right">Due</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bookings.map((b) => (
                      <tr
                        key={b.id}
                        className={`border-b last:border-0 hover:bg-gray-50 ${b.isOverdue ? "bg-red-50/50" : ""}`}
                      >
                        <td className="p-4">
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {b.bookingId}
                          </Link>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{b.customer.name}</p>
                          <p className="text-muted-foreground text-xs">{b.customer.phone}</p>
                        </td>
                        <td className="p-4 text-right">{formatCurrency(b.totalAmount)}</td>
                        <td className="p-4 text-right text-green-600">
                          {formatCurrency(b.totalPaid)}
                        </td>
                        <td className="p-4 text-right font-medium text-orange-600">
                          {formatCurrency(b.outstanding)}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={b.paymentStatus} />
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {b.paymentDueDate
                            ? new Date(b.paymentDueDate).toLocaleDateString("en-IN")
                            : "-"}
                          {b.isOverdue && (
                            <span className="ml-1 text-xs font-medium text-red-600">
                              Overdue
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <p className="text-muted-foreground text-sm">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
