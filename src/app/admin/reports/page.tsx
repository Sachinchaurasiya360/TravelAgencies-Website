"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/helpers/currency";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowRight,
  BarChart3,
  PieChart,
  Wallet,
} from "lucide-react";

interface ReportSummary {
  totalRevenue: string;
  totalExpenses: string;
  netProfit: string;
  outstandingDues: string;
  totalBookings: number;
  completedBookings: number;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("/api/reports/summary");
        const result = await res.json();
        if (result.success) {
          setSummary(result.data);
        }
      } catch {
        toast.error("Failed to fetch report summary");
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Business analytics and financial reports"
      />

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <IndianRupee className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalRevenue)}
              </div>
              <p className="text-muted-foreground text-xs">
                From {summary.completedBookings} completed bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Net Profit
              </CardTitle>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.netProfit)}
              </div>
              <p className="text-muted-foreground text-xs">
                After expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <TrendingDown className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </div>
              <p className="text-muted-foreground text-xs">
                All-time expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Outstanding Dues
              </CardTitle>
              <AlertCircle className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.outstandingDues)}
              </div>
              <p className="text-muted-foreground text-xs">
                Pending collection
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Link Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/reports/revenue" className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-green-100 p-3">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Revenue Report</h3>
                <p className="text-muted-foreground text-sm">
                  Monthly and yearly revenue breakdown
                </p>
              </div>
              <ArrowRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/reports/profit-loss" className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-blue-100 p-3">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Profit & Loss</h3>
                <p className="text-muted-foreground text-sm">
                  Income vs expenses analysis
                </p>
              </div>
              <ArrowRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/reports/outstanding-dues" className="group">
          <Card className="transition-shadow group-hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-orange-100 p-3">
                <Wallet className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Outstanding Dues</h3>
                <p className="text-muted-foreground text-sm">
                  Unpaid invoices and overdue payments
                </p>
              </div>
              <ArrowRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
