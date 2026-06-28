/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  BarChart3,
} from "lucide-react";

const COLORS = [
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#3b82f6",
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs">
        {payload.map((entry, i) => (
          <p key={i} className="text-zinc-200" style={{ color: entry.color }}>
            {entry.name}:{" "}
            <span className="font-bold">{entry.value?.toFixed(0)} EGP</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs">
        <p className="text-zinc-400">{payload[0].name}</p>
        <p className="text-white font-bold">
          {payload[0].value?.toFixed(0)} EGP
        </p>
      </div>
    );
  }
  return null;
};

function KPICard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string;
  sub: string;
  icon: any;
  trend?: "up" | "down";
  color: string;
}) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 font-medium">{title}</p>
            <p className={`text-2xl font-bold tracking-tight ${color}`}>
              {value}
            </p>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              {trend === "up" && (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              )}
              {trend === "down" && (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              {sub}
            </p>
          </div>
          <div className={`p-2 rounded-lg bg-zinc-800`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 bg-zinc-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 bg-zinc-800 rounded-xl" />
          <Skeleton className="h-72 bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <BarChart3 className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">لا توجد بيانات</p>
      </div>
    );
  }

  const expensesData = analytics.expensesByCategory
    ? Object.entries(analytics.expensesByCategory).map(
        ([category, amount]: any) => ({
          name: category,
          value: typeof amount === "number" ? amount : 0,
        }),
      )
    : [];

  const bestSellersData = (analytics.bestSellers || []).map((item: any) => ({
    name: item.name || "Unknown",
    quantity: typeof item.quantity === "number" ? item.quantity : 0,
  }));

  const revenueSummaryData = [
    {
      name: "المالية",
      revenue: analytics.totalRevenue ?? 0,
      cogs: analytics.totalCOGS ?? 0,
      expenses: analytics.totalExpenses ?? 0,
      profit: analytics.netProfit ?? 0,
    },
  ];

  const totalRevenue = analytics.totalRevenue ?? 0;
  const totalExpenses = analytics.totalExpenses ?? 0;
  const totalCOGS = analytics.totalCOGS ?? 0;
  const netProfit = analytics.netProfit ?? 0;
  const totalOrders = analytics.totalOrders ?? 0;

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const expenseRatio =
    totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          لوحة التحكم
        </h1>
        <p className="text-zinc-500 text-sm mt-1">نظرة عامة على أداء المتجر</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="الإيرادات"
          value={`${totalRevenue.toFixed(0)}`}
          sub="EGP هذا الشهر"
          icon={DollarSign}
          trend="up"
          color="text-emerald-400"
        />
        <KPICard
          title="المصاريف"
          value={`${totalExpenses.toFixed(0)}`}
          sub="EGP إجمالي"
          icon={TrendingDown}
          trend="down"
          color="text-red-400"
        />
        <KPICard
          title="تكلفة البضاعة"
          value={`${totalCOGS.toFixed(0)}`}
          sub="EGP COGS"
          icon={Package}
          color="text-blue-400"
        />
        <KPICard
          title="الربح الصافي"
          value={`${netProfit.toFixed(0)}`}
          sub={`${profitMargin.toFixed(1)}% هامش الربح`}
          icon={TrendingUp}
          trend={netProfit >= 0 ? "up" : "down"}
          color={netProfit >= 0 ? "text-violet-400" : "text-red-400"}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-300">
              ملخص المالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueSummaryData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
                <Bar
                  dataKey="revenue"
                  fill="#10b981"
                  name="الإيرادات"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="cogs"
                  fill="#6366f1"
                  name="COGS"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  fill="#ef4444"
                  name="المصاريف"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="profit"
                  fill="#8b5cf6"
                  name="الربح"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-300">
              توزيع المصاريف
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={expensesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name}: ${typeof value === "number" ? value.toFixed(0) : value}`
                    }
                    outerRadius={90}
                    dataKey="value"
                    stroke="none"
                  >
                    {expensesData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                لا توجد مصاريف
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-300">
              الأكثر مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bestSellersData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bestSellersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="name"
                    angle={-35}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: "#71717a", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="quantity"
                    fill="#6366f1"
                    name="الكمية"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-300">
              المقاييس الرئيسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: "عدد الطلبات",
                value: totalOrders,
                unit: "",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                label: "متوسط قيمة الطلب",
                value: avgOrderValue.toFixed(0),
                unit: " EGP",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                label: "نسبة الربح",
                value: profitMargin.toFixed(1),
                unit: "%",
                color: "text-violet-400",
                bg: "bg-violet-500/10",
              },
              {
                label: "المصاريف (نسبة)",
                value: expenseRatio.toFixed(1),
                unit: "%",
                color: "text-red-400",
                bg: "bg-red-500/10",
              },
            ].map((m) => (
              <div
                key={m.label}
                className={`flex items-center justify-between p-3 rounded-lg ${m.bg}`}
              >
                <span className="text-sm text-zinc-400">{m.label}</span>
                <span className={`text-xl font-bold ${m.color}`}>
                  {m.value}
                  {m.unit}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
