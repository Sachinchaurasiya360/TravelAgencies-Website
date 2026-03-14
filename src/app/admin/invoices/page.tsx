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
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDate } from "@/lib/helpers/date";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { getStatusLabel } from "@/lib/i18n/label-maps";
import {
  Search,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Share2,
  CheckCircle,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  grandTotal: string;
  invoiceDate: string;
  shareToken: string | null;
  signedAt: string | null;
  booking: {
    id: string;
    bookingId: string;
  };
  customer: {
    id: string;
    name: string;
  };
}

export default function InvoicesPage() {
  const t = useT();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInvoices = useCallback(async () => {
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

      const res = await fetch(`/api/invoices?${params}`);
      const result = await res.json();

      if (result.success) {
        setInvoices(result.data.invoices);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch {
      toast.error(t.invoices.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  async function handleDownloadPdf(invoiceId: string, invoiceNumber: string) {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const html = await res.text();

      // Render HTML in a hidden iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.left = "-9999px";
      iframe.style.width = "794px"; // A4 width at 96dpi
      iframe.style.height = "1123px"; // A4 height
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Failed to create iframe");

      // Write HTML without the auto-print script
      iframeDoc.open();
      iframeDoc.write(html.replace(/<script>.*?<\/script>/g, ""));
      iframeDoc.close();

      // Wait for content to render
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { default: html2canvas } = await import("html2canvas-pro");
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        width: 794,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page if content is longer than one page
      const pageHeight = pdf.internal.pageSize.getHeight();
      let position = 0;

      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      } else {
        while (position < pdfHeight) {
          pdf.addImage(imgData, "PNG", 0, -position, pdfWidth, pdfHeight);
          position += pageHeight;
          if (position < pdfHeight) {
            pdf.addPage();
          }
        }
      }

      pdf.save(`${invoiceNumber}.pdf`);
      document.body.removeChild(iframe);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error(t.invoices.pdfFailed);
    }
  }

  async function handleShare(invoiceId: string) {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/share`, { method: "POST" });
      const result = await res.json();
      if (result.success) {
        if (result.data.whatsappUrl) {
          window.open(result.data.whatsappUrl, "_blank");
        }
        toast.success(t.invoices.shareSent);
        fetchInvoices();
      } else {
        toast.error(result.error || t.invoices.shareFailed);
      }
    } catch {
      toast.error(t.invoices.shareFailed);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.invoices.title}
        description={t.invoices.subtitle}
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t.invoices.searchPlaceholder}
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
                <SelectValue placeholder={t.invoices.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.invoices.allStatuses}</SelectItem>
                <SelectItem value="DRAFT">{t.status.draft}</SelectItem>
                <SelectItem value="ISSUED">{t.status.issued}</SelectItem>
                <SelectItem value="PAID">{t.status.paid}</SelectItem>
                <SelectItem value="PARTIALLY_PAID">{t.status.partiallyPaid}</SelectItem>
                <SelectItem value="OVERDUE">{t.status.overdue}</SelectItem>
                <SelectItem value="VOID">{t.status.void}</SelectItem>
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
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t.invoices.noInvoicesFound}
              description={t.invoices.noInvoicesMatch}
            />
          ) : (
            <>
              {/* Mobile card view */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {invoice.invoiceNumber}
                        </span>
                        <StatusBadge status={invoice.status} label={getStatusLabel(t, invoice.status)} />
                        {invoice.signedAt && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-800">
                            <CheckCircle className="h-2.5 w-2.5" />
                            {t.common.signed}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.grandTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{invoice.customer.name}</span>
                      <span className="text-xs text-gray-400">{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {t.invoices.pdf}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleShare(invoice.id)}
                      >
                        <Share2 className="mr-1 h-3 w-3" />
                        {t.invoices.share}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-4 font-medium">{t.invoices.invoiceNumber}</th>
                      <th className="p-4 font-medium">{t.invoices.customer}</th>
                      <th className="p-4 font-medium">{t.invoices.bookingId}</th>
                      <th className="p-4 font-medium">{t.invoices.grandTotal}</th>
                      <th className="p-4 font-medium">{t.invoices.status}</th>
                      <th className="p-4 font-medium">{t.invoices.date}</th>
                      <th className="p-4 font-medium">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="p-4 font-medium">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/admin/customers/${invoice.customer.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {invoice.customer.name}
                          </Link>
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/admin/bookings/${invoice.booking.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {invoice.booking.bookingId}
                          </Link>
                        </td>
                        <td className="p-4 font-medium">
                          {formatCurrency(invoice.grandTotal)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={invoice.status} label={getStatusLabel(t, invoice.status)} />
                            {invoice.signedAt && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                <CheckCircle className="h-3 w-3" />
                                {t.common.signed}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadPdf(
                                  invoice.id,
                                  invoice.invoiceNumber
                                )
                              }
                            >
                              <Download className="mr-1 h-3 w-3" />
                              {t.invoices.pdf}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShare(invoice.id)}
                            >
                              <Share2 className="mr-1 h-3 w-3" />
                              {t.invoices.share}
                            </Button>
                          </div>
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
