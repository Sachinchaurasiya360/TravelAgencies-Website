"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDate } from "@/lib/helpers/date";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { getStatusLabel } from "@/lib/i18n/label-maps";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

interface Refund {
  id: string;
  refundNumber: string;
  amount: string;
  status: string;
  reason: string | null;
  createdAt: string;
  booking: {
    id: string;
    bookingId: string;
  };
  customer: {
    id: string;
    name: string;
  };
}

export default function RefundsPage() {
  const t = useT();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/refunds?${params}`);
      const result = await res.json();

      if (result.success) {
        setRefunds(result.data.refunds);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch {
      toast.error(t.refunds.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.refunds.title}
        description={t.refunds.subtitle}
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t.refunds.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.refunds.allStatuses}</SelectItem>
                <SelectItem value="REQUESTED">{t.status.requested}</SelectItem>
                <SelectItem value="PROCESSED">{t.status.processed}</SelectItem>
                <SelectItem value="REJECTED">{t.status.rejected}</SelectItem>
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
          ) : refunds.length === 0 ? (
            <EmptyState
              icon={RotateCcw}
              title={t.refunds.noRefundsFound}
              description={t.refunds.noRefundsMatch}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-4 font-medium">{t.refunds.refundNumber}</th>
                      <th className="p-4 font-medium">{t.refunds.customer}</th>
                      <th className="p-4 font-medium">{t.refunds.bookingId}</th>
                      <th className="p-4 font-medium">{t.refunds.requestedAmount}</th>
                      <th className="p-4 font-medium">{t.refunds.status}</th>
                      <th className="p-4 font-medium">{t.refunds.date}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund) => (
                      <tr
                        key={refund.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="p-4 font-medium">
                          {refund.refundNumber}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/admin/customers/${refund.customer.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {refund.customer.name}
                          </Link>
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/admin/bookings/${refund.booking.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {refund.booking.bookingId}
                          </Link>
                        </td>
                        <td className="p-4 font-medium">
                          {formatCurrency(refund.amount)}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={refund.status} label={getStatusLabel(t, refund.status)} />
                        </td>
                        <td className="p-4">
                          {formatDate(refund.createdAt)}
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
