"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatCurrency } from "@/lib/helpers/currency";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowRight,
  BarChart3,
  PieChart as PieChartIcon,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { getStatusLabel } from "@/lib/i18n/label-maps";

// ---------- Types ----------

interface ReportSummary {
  totalRevenue: string;
  totalExpenses: string;
  netProfit: string;
  outstandingDues: string;
  totalBookings: number;
  completedBookings: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

interface VehicleBreakdown {
  vehicle: string;
  count: number;
  revenue: number;
}

interface ChartData {
  monthlyRevenue: MonthlyRevenue[];
  statusBreakdown: StatusBreakdown[];
  vehicleBreakdown: VehicleBreakdown[];
}

type Period = "thisMonth" | "lastMonth" | "last3Months" | "thisYear" | "allTime";

// ---------- Constants ----------

const CHART_COLORS = [
  "#f97316",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f97316",
  CONFIRMED: "#10b981",
  CANCELLED: "#ef4444",
};

// ---------- Helpers ----------

function formatCompactCurrency(value: number): string {
  if (value >= 100000) return `\u20B9${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `\u20B9${(value / 1000).toFixed(1)}K`;
  return `\u20B9${value.toFixed(0)}`;
}

// ---------- Main Component ----------

export default function ReportsPage() {
  const t = useT();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("thisYear");

  const isInitialMount = useRef(true);

  const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: "thisMonth", label: t.reports.thisMonth },
    { value: "lastMonth", label: t.reports.lastMonth },
    { value: "last3Months", label: t.reports.threeMonths },
    { value: "thisYear", label: t.reports.thisYear },
    { value: "allTime", label: t.reports.allTime },
  ];

  const fetchCharts = useCallback(async (selectedPeriod: Period) => {
    setChartsLoading(true);
    try {
      const res = await fetch(`/api/reports/charts?period=${selectedPeriod}`);
      const result = await res.json();
      if (result.success) setChartData(result.data);
    } catch {
      toast.error(t.reports.fetchChartFailed);
    } finally {
      setChartsLoading(false);
    }
  }, []);

  // Parallelize summary + charts on initial mount
  useEffect(() => {
    async function loadInitialData() {
      const [summaryRes, chartsRes] = await Promise.allSettled([
        fetch("/api/reports/summary").then((r) => r.json()),
        fetch(`/api/reports/charts?period=${period}`).then((r) => r.json()),
      ]);

      if (summaryRes.status === "fulfilled" && summaryRes.value.success) {
        setSummary(summaryRes.value.data);
      } else {
        toast.error(t.reports.fetchSummaryFailed);
      }
      if (chartsRes.status === "fulfilled" && chartsRes.value.success) {
        setChartData(chartsRes.value.data);
      } else {
        toast.error(t.reports.fetchChartFailed);
      }
      setLoading(false);
      setChartsLoading(false);
    }
    loadInitialData();
  }, []);

  // Refetch charts only on period change (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchCharts(period);
  }, [period, fetchCharts]);

  if (loading) return <LoadingSpinner />;

  const totalStatusCount = chartData?.statusBreakdown.reduce((a, b) => a + b.count, 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            {t.reports.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t.reports.subtitle}
          </p>
        </div>

        {/* Period Tabs */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  period === opt.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.reports.totalRevenue}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-green-600">
                    {formatCurrency(summary.totalRevenue)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {summary.completedBookings} {t.reports.confirmedBookings}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.reports.netProfit}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-blue-600">
                    {formatCurrency(summary.netProfit)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{t.reports.afterExpenses}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.reports.expensesLabel}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-red-600">
                    {formatCurrency(summary.totalExpenses)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{t.reports.allTimeTotal}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.reports.outstanding}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-orange-600">
                    {formatCurrency(summary.outstandingDues)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{t.reports.pendingCollection}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {chartsLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        chartData && (
          <div className="space-y-6">
            {/* Revenue & Bookings Line Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue Trend */}
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-900">{t.reports.revenueTrend}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{t.reports.monthlyRevenueOverview}</p>
                  </div>
                  {chartData.monthlyRevenue.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData.monthlyRevenue}
                          margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={formatCompactCurrency}
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            axisLine={false}
                            tickLine={false}
                            width={55}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
                                  <p className="font-medium text-gray-900">{label}</p>
                                  <p className="mt-1 text-blue-600 font-semibold">
                                    {formatCurrency(payload[0].value as number)}
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#revenueGrad)"
                            dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-52 items-center justify-center text-xs text-gray-400">
                      {t.reports.noRevenueData}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bookings Trend */}
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-900">{t.reports.bookingsTrend}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{t.reports.monthlyBookingVolume}</p>
                  </div>
                  {chartData.monthlyRevenue.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData.monthlyRevenue}
                          margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f97316" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                            width={30}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
                                  <p className="font-medium text-gray-900">{label}</p>
                                  <p className="mt-1 text-orange-600 font-semibold">
                                    {interpolate(t.reports.bookingsTooltip, { count: payload[0].value as number })}
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="bookings"
                            stroke="#f97316"
                            strokeWidth={2}
                            fill="url(#bookingsGrad)"
                            dot={{ fill: "#f97316", r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-52 items-center justify-center text-xs text-gray-400">
                      {t.reports.noBookingData}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Status + Vehicle Distribution */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Booking Status */}
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-900">{t.reports.bookingStatus}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{t.reports.bookingStatusDistribution}</p>
                  </div>
                  {chartData.statusBreakdown.length > 0 ? (
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                      {/* Donut Chart */}
                      <div className="h-44 w-44 shrink-0 sm:h-52 sm:w-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData.statusBreakdown}
                              dataKey="count"
                              nameKey="status"
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={65}
                              paddingAngle={3}
                              stroke="none"
                            >
                              {chartData.statusBreakdown.map((entry, index) => (
                                <Cell
                                  key={entry.status}
                                  fill={
                                    STATUS_COLORS[entry.status] ||
                                    CHART_COLORS[index % CHART_COLORS.length]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const item = payload[0];
                                return (
                                  <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
                                    <p className="font-medium text-gray-900">
                                      {getStatusLabel(t, (item.payload as StatusBreakdown).status)}
                                    </p>
                                    <p className="text-gray-500">{interpolate(t.reports.bookingsTooltip, { count: item.value as number })}</p>
                                  </div>
                                );
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Legend as list */}
                      <div className="flex flex-col gap-3 flex-1 w-full">
                        {chartData.statusBreakdown.map((entry, index) => {
                          const pct = totalStatusCount
                            ? Math.round((entry.count / totalStatusCount) * 100)
                            : 0;
                          const color =
                            STATUS_COLORS[entry.status] ||
                            CHART_COLORS[index % CHART_COLORS.length];
                          return (
                            <div key={entry.status}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-xs font-medium text-gray-700">
                                    {getStatusLabel(t, entry.status)}
                                  </span>
                                </div>
                                <span className="text-xs tabular-nums text-gray-500">
                                  {entry.count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-gray-100">
                                <div
                                  className="h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: color,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-52 items-center justify-center text-xs text-gray-400">
                      {t.reports.noBookingData}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vehicle Distribution */}
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-900">{t.reports.vehicleDistribution}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{t.reports.revenueByVehicle}</p>
                  </div>
                  {chartData.vehicleBreakdown.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData.vehicleBreakdown}
                          layout="vertical"
                          margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                          <XAxis
                            type="number"
                            tickFormatter={formatCompactCurrency}
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="vehicle"
                            width={100}
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
                                  <p className="font-medium text-gray-900">{label}</p>
                                  {payload.map((entry) => (
                                    <p key={entry.dataKey as string} className="mt-0.5 text-gray-500">
                                      {(entry.dataKey as string) === "revenue"
                                        ? `Revenue: ${formatCurrency(entry.value as number)}`
                                        : `Bookings: ${entry.value}`}
                                    </p>
                                  ))}
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
                            {chartData.vehicleBreakdown.map((_entry, index) => (
                              <Cell
                                key={`vehicle-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-52 items-center justify-center text-xs text-gray-400">
                      {t.reports.noVehicleData}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )
      )}

      {/* Detailed Reports */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
          {t.reports.detailedReports}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/admin/reports/revenue" className="group">
            <Card className="border-gray-200 transition-all hover:border-gray-300 hover:shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{t.reports.revenueReport}</h3>
                  <p className="text-xs text-gray-400 truncate">{t.reports.revenueReportDesc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:text-gray-500 group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/reports/profit-loss" className="group">
            <Card className="border-gray-200 transition-all hover:border-gray-300 hover:shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <PieChartIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{t.reports.profitLoss}</h3>
                  <p className="text-xs text-gray-400 truncate">{t.reports.profitLossDesc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:text-gray-500 group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/reports/outstanding-dues" className="group">
            <Card className="border-gray-200 transition-all hover:border-gray-300 hover:shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                  <Wallet className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{t.reports.outstandingDues}</h3>
                  <p className="text-xs text-gray-400 truncate">{t.reports.outstandingDuesDesc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:text-gray-500 group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
