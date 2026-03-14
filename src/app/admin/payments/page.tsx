"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDate } from "@/lib/helpers/date";
import { PAYMENT_METHODS } from "@/lib/constants";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { getPaymentMethodLabel } from "@/lib/i18n/label-maps";
import {
  Search,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

interface Payment {
  id: string;
  receiptNumber: string;
  amount: string;
  method: string;
  isAdvance: boolean;
  paymentDate: string;
  booking: {
    id: string;
    bookingId: string;
  };
  customer: {
    id: string;
    name: string;
  };
}

export default function PaymentsPage() {
  const t = useT();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const filters: Record<string, string> = {};
      if (search) filters.search = search;

      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payments", filters }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t.payments.exportDownloaded);
    } catch {
      toast.error(t.payments.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy: "paymentDate",
        sortOrder: "desc",
      });
      if (search) params.set("search", search);
      if (methodFilter !== "all") params.set("method", methodFilter);
      if (typeFilter !== "all") params.set("isAdvance", typeFilter);

      const res = await fetch(`/api/payments?${params}`);
      const result = await res.json();

      if (result.success) {
        setPayments(result.data.payments);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch {
      toast.error(t.payments.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [page, search, methodFilter, typeFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t.payments.title}
          description={t.payments.subtitle}
        />
        <Button variant="outline" onClick={handleExport} disabled={exporting} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          {exporting ? t.common.exporting : t.payments.exportExcel}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t.payments.searchPlaceholder}
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={methodFilter}
              onValueChange={(v) => {
                setMethodFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.payments.allMethods} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.payments.allMethods}</SelectItem>
                {PAYMENT_METHODS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {getPaymentMethodLabel(t, value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.payments.allTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.payments.allTypes}</SelectItem>
                <SelectItem value="true">{t.payments.advanceType}</SelectItem>
                <SelectItem value="false">{t.payments.regularType}</SelectItem>
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
          ) : payments.length === 0 ? (
            <EmptyState
              icon={IndianRupee}
              title={t.payments.noPaymentsFound}
              description={t.payments.noPaymentsMatch}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-4 font-medium">{t.payments.receiptNumber}</th>
                      <th className="p-4 font-medium">{t.payments.customer}</th>
                      <th className="p-4 font-medium">{t.payments.amount}</th>
                      <th className="p-4 font-medium">{t.payments.method}</th>
                      <th className="p-4 font-medium">{t.payments.type}</th>
                      <th className="p-4 font-medium">{t.payments.date}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="p-4 font-medium">
                          {payment.receiptNumber}
                        </td>
                        <td className="p-4">
                          <div>
                            <Link
                              href={`/admin/customers/${payment.customer.id}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {payment.customer.name}
                            </Link>
                            <p className="text-muted-foreground text-xs">
                              <Link
                                href={`/admin/bookings/${payment.booking.id}`}
                                className="hover:underline"
                              >
                                {payment.booking.bookingId}
                              </Link>
                            </p>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="p-4">
                          {getPaymentMethodLabel(t, payment.method)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              payment.isAdvance
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {payment.isAdvance ? t.payments.advanceType : t.payments.regularType}
                          </span>
                        </td>
                        <td className="p-4">
                          {formatDate(payment.paymentDate)}
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
