/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import { useOrders } from "@/hooks/useOrders";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  BarChart3,
  Wallet,
  Receipt,
  Ban,
} from "lucide-react";

const COLORS = [
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#3b82f6",
];

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n);

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
        {payload.map((entry, i) => (
          <p key={i} className="text-zinc-300 flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}:{" "}
            <span className="font-semibold text-white">
              {entry.value?.toFixed(0)} EGP
            </span>
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
        <p className="text-white font-semibold">
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
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] text-zinc-500 font-medium truncate">
              {title}
            </p>
            <p
              className={`text-xl font-bold tracking-tight tabular-nums ${color}`}
            >
              {value}
            </p>
            <p className="text-[11px] text-zinc-600 flex items-center gap-1">
              {trend === "up" && (
                <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
              )}
              {trend === "down" && (
                <TrendingDown className="w-3 h-3 text-red-500 shrink-0" />
              )}
              <span className="truncate">{sub}</span>
            </p>
          </div>
          <div className="p-2 rounded-lg bg-zinc-800 shrink-0">
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: analytics, isLoading } = useAnalytics();
  const { data: orders = [] } = useOrders();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <Skeleton className="h-32 bg-zinc-800 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-zinc-800 rounded-xl" />
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
      <div className="flex flex-col items-center justify-center h-64 text-zinc-600 gap-2">
        <BarChart3 className="w-10 h-10 opacity-30" />
        <p className="text-sm text-zinc-500">لا توجد بيانات كافية بعد</p>
        <p className="text-xs text-zinc-700">
          هتظهر هنا أول ما تسجّل طلبات ومصاريف
        </p>
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

  const orderStats = orders.reduce(
    (acc: any, order: any) => {
      const price = Number(order.total_price) || 0;
      if (order.status === "delivered") acc.income += price;
      if (["pending", "prepared", "shipped"].includes(order.status))
        acc.expectedIncome += price;
      if (order.status === "cancelled") acc.cancelled += price;
      return acc;
    },
    { income: 0, expectedIncome: 0, cancelled: 0 },
  );

  const revenueSummaryData = [
    {
      name: "المالية",
      revenue: orderStats.income,
      cogs: analytics.totalCOGS ?? 0,
      expenses: analytics.totalExpenses ?? 0,
      profit: analytics.netProfit ?? 0,
    },
  ];

  const totalRevenue = orderStats.income;
  const totalExpenses = analytics.totalExpenses ?? 0;
  const totalCOGS = analytics.totalCOGS ?? 0;
  const netProfit = analytics.netProfit ?? 0;
  const totalOrders = analytics.totalOrders ?? 0;

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const expenseRatio =
    totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
  const isProfitable = netProfit >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          لوحة التحكم
        </h1>
        <p className="text-zinc-500 text-sm mt-1">نظرة عامة على أداء المتجر</p>
      </div>

      {/* Hero — Net Profit */}
      <Card
        className={`border overflow-hidden relative ${
          isProfitable
            ? "bg-gradient-to-br from-violet-950/40 via-zinc-900 to-zinc-900 border-violet-500/20"
            : "bg-gradient-to-br from-red-950/40 via-zinc-900 to-zinc-900 border-red-500/20"
        }`}
      >
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                الربح الصافي
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl md:text-5xl font-bold tracking-tight tabular-nums ${
                    isProfitable ? "text-violet-300" : "text-red-400"
                  }`}
                >
                  {fmt(netProfit)}
                </span>
                <span className="text-zinc-500 text-sm font-medium">EGP</span>
              </div>
              <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
                {isProfitable ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                )}
                هامش ربح {profitMargin.toFixed(1)}% من إجمالي الإيرادات
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 md:gap-6 md:text-right shrink-0">
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">الإيرادات</p>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">
                  {fmt(totalRevenue)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">
                  تكلفة البضاعة
                </p>
                <p className="text-sm font-bold text-blue-400 tabular-nums">
                  {fmt(totalCOGS)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">المصاريف</p>
                <p className="text-sm font-bold text-red-400 tabular-nums">
                  {fmt(totalExpenses)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
          الإيرادات والطلبات
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KPICard
            title="الدخل المتوقع"
            value={fmt(orderStats.expectedIncome)}
            sub="طلبات قيد التنفيذ"
            icon={Wallet}
            color="text-yellow-400"
          />
          <KPICard
            title="طلبات ملغاة"
            value={fmt(orderStats.cancelled)}
            sub="EGP قيمة ملغاة"
            icon={Ban}
            trend="down"
            color="text-red-400"
          />
          <KPICard
            title="متوسط قيمة الطلب"
            value={fmt(avgOrderValue)}
            sub={`${totalOrders} طلب إجمالاً`}
            icon={ShoppingCart}
            color="text-indigo-400"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
          الكفاءة التشغيلية
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KPICard
            title="تكلفة البضاعة"
            value={fmt(totalCOGS)}
            sub="COGS إجمالي"
            icon={Package}
            color="text-blue-400"
          />
          <KPICard
            title="نسبة المصاريف"
            value={`${expenseRatio.toFixed(1)}%`}
            sub="من الإيرادات"
            icon={Receipt}
            trend="down"
            color="text-orange-400"
          />
          <KPICard
            title="هامش الربح"
            value={`${profitMargin.toFixed(1)}%`}
            sub={isProfitable ? "أداء إيجابي" : "أداء سلبي"}
            icon={DollarSign}
            trend={isProfitable ? "up" : "down"}
            color={isProfitable ? "text-violet-400" : "text-red-400"}
          />
        </div>
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
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#27272a55" }}
                />
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
              <div className="flex flex-col items-center justify-center h-64 text-zinc-600 gap-1.5">
                <Receipt className="w-8 h-8 opacity-30" />
                <p className="text-sm text-zinc-600">
                  لا توجد مصاريف مسجلة بعد
                </p>
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
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#27272a55" }}
                  />
                  <Bar
                    dataKey="quantity"
                    fill="#6366f1"
                    name="الكمية"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-600 gap-1.5">
                <Package className="w-8 h-8 opacity-30" />
                <p className="text-sm text-zinc-600">
                  لا توجد بيانات مبيعات بعد
                </p>
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
          <CardContent className="space-y-2.5">
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
                className={`flex items-center justify-between px-3.5 py-3 rounded-lg ${m.bg}`}
              >
                <span className="text-sm text-zinc-400">{m.label}</span>
                <span className={`text-lg font-bold tabular-nums ${m.color}`}>
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
