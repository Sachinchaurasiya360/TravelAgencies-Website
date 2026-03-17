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
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Filter,
} from "lucide-react";
import { useT } from "@/lib/i18n/language-context";

interface PLData {
  income: {
    totalPaymentsReceived: number;
    paymentCount: number;
    cancellationFeeIncome: number;
  };
  expenses: {
    totalRefunds: number;
    refundCount: number;
  };
  summary: {
    netRevenue: number;
  };
}

export default function ProfitLossPage() {
  const t = useT();
  const [data, setData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function fetchData(from?: string, to?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("fromDate", from);
      if (to) params.set("toDate", to);
      const res = await fetch(`/api/reports/profit-loss?${params}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch {
      toast.error(t.profitLoss.fetchFailed);
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
        title={t.profitLoss.title}
        description={t.profitLoss.subtitle}
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
              <Label htmlFor="fromDate">{t.profitLoss.fromDate}</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="toDate">{t.profitLoss.toDate}</Label>
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
              {t.profitLoss.applyFilter}
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
          {/* Net Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.profitLoss.netRevenue}</CardTitle>
                <TrendingUp className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(data.summary.netRevenue)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {t.profitLoss.totalIncomeMinusRefunds}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Income & Expenses Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  {t.profitLoss.income}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.profitLoss.paymentsReceived}</span>
                  <span className="font-medium">
                    {formatCurrency(data.income.totalPaymentsReceived)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.profitLoss.paymentCount}</span>
                  <span className="font-medium">{data.income.paymentCount}</span>
                </div>
                {data.income.cancellationFeeIncome > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.profitLoss.cancellationFees}</span>
                    <span className="font-medium">
                      {formatCurrency(data.income.cancellationFeeIncome)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  {t.profitLoss.expenses}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.profitLoss.totalRefunds}</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(data.expenses.totalRefunds)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.profitLoss.refundCount}</span>
                  <span className="font-medium">{data.expenses.refundCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
