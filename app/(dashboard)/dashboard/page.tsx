/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAnalytics, AnalyticsRange } from "@/hooks/useAnalytics";
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
  Package,
  ShoppingCart,
  BarChart3,
  Receipt,
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
            <p className="text-[11px] text-zinc-600 flex items-start gap-1">
              {trend === "up" && (
                <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
              )}
              {trend === "down" && (
                <TrendingDown className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{sub}</span>
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

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "this_month", label: "هذا الشهر" },
  { value: "last_month", label: "الشهر اللي فات" },
  { value: "all_time", label: "كل الوقت" },
  { value: "custom", label: "فترة مخصصة" },
];

export default function DashboardPage() {
  const [range, setRange] = useState<AnalyticsRange>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { data: analytics, isLoading } = useAnalytics({
    range,
    from: customFrom,
    to: customTo,
  });

  const filterBar = (
    <div className="flex flex-wrap items-center gap-2">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setRange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            range === opt.value
              ? "bg-violet-600 text-white"
              : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
      {range === "custom" && (
        <div className="flex items-center gap-2 ms-1">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
          />
          <span className="text-zinc-600 text-xs">إلى</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
          />
        </div>
      )}
    </div>
  );

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

  if (!analytics || analytics.error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            لوحة التحكم
          </h1>
          {filterBar}
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-zinc-600 gap-2">
          <BarChart3 className="w-10 h-10 opacity-30" />
          <p className="text-sm text-zinc-500">لا توجد بيانات كافية بعد</p>
          <p className="text-xs text-zinc-700">
            هتظهر هنا أول ما تسجّل طلبات ومصاريف في الفترة دي
          </p>
        </div>
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

  // All figures now come from the single analytics source — no mixed-period bugs
  const totalRevenue = analytics.totalRevenue ?? 0;
  const expectedIncome = analytics.expectedIncome ?? 0;
  const cancelledAmount = analytics.cancelledAmount ?? 0;
  const totalExpenses = analytics.totalExpenses ?? 0;
  const totalCOGS = analytics.totalCOGS ?? 0;
  const totalPurchaseCost = analytics.totalPurchaseCost ?? 0;
  const totalSpending = analytics.totalSpending ?? 0;
  const netProfit = analytics.netProfit ?? 0;
  const cashFlow = analytics.cashFlow ?? 0;
  const totalOrders = analytics.totalOrders ?? 0;
  const deliveredOrders = analytics.deliveredOrdersCount ?? 0;

  const revenueSummaryData = [
    {
      name: "المالية",
      revenue: totalRevenue,
      cogs: totalCOGS,
      expenses: totalExpenses,
      profit: netProfit,
    },
  ];

  const avgOrderValue =
    deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const expenseRatio =
    totalRevenue > 0 ? (totalSpending / totalRevenue) * 100 : 0;
  const isProfitable = netProfit >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            لوحة التحكم
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            نظرة عامة على أداء المتجر
          </p>
        </div>
        {filterBar}
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
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
                <p className="text-[11px] text-zinc-600 mt-1.5 max-w-xs leading-snug">
                  إيه اللي فضل معاك بعد ما بعت وصرفت، من غير البضاعة اللي لسه
                  قاعدة
                </p>
              </div>

              <div className="border-t sm:border-t-0 sm:border-s border-zinc-800 pt-4 sm:pt-0 sm:ps-8">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  صافي التدفق النقدي
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl md:text-3xl font-bold tracking-tight tabular-nums ${
                      cashFlow >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {fmt(cashFlow)}
                  </span>
                  <span className="text-zinc-500 text-sm font-medium">EGP</span>
                </div>
                <p className="text-[11px] text-zinc-600 mt-1.5 max-w-xs leading-snug">
                  كل الفلوس اللي خرجت فعليًا من جيبك (بضاعة لسه في المخزن +
                  مباعة + مصاريف) مقابل اللي دخلت
                </p>
              </div>
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
                  {fmt(totalPurchaseCost)}
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

      {/* Consolidated KPI Cards — one row, no duplication/overlap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <KPICard
          title="الدخل المتوقع"
          value={fmt(expectedIncome)}
          sub="طلبات قيد التنفيذ"
          icon={ShoppingCart}
          color="text-yellow-400"
        />
        <KPICard
          title="طلبات ملغاة"
          value={fmt(cancelledAmount)}
          sub="قيمة ملغاة (EGP)"
          icon={TrendingDown}
          trend="down"
          color="text-red-400"
        />
        <KPICard
          title="متوسط قيمة الطلب"
          value={fmt(avgOrderValue)}
          sub={`${deliveredOrders} طلب مُسلَّم`}
          icon={Package}
          color="text-indigo-400"
        />
        <KPICard
          title="عدد الطلبات"
          value={fmt(totalOrders)}
          sub="إجمالي الطلبات في الفترة"
          icon={BarChart3}
          color="text-cyan-400"
        />
        <KPICard
          title="إجمالي المصروفات"
          value={fmt(totalSpending)}
          sub={`نسبة ${expenseRatio.toFixed(1)}% من الإيرادات`}
          icon={Receipt}
          trend="down"
          color="text-orange-400"
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
                  لا توجد مصاريف مسجلة في الفترة دي
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
                  لا توجد بيانات مبيعات في الفترة دي
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
                label: "عدد الطلبات المُسلَّمة",
                value: totalOrders,
                unit: "",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                label: "نسبة الربح",
                value: profitMargin.toFixed(1),
                unit: "%",
                color: "text-violet-400",
                bg: "bg-violet-500/10",
              },
              {
                label: "نسبة التكاليف الإجمالية",
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
