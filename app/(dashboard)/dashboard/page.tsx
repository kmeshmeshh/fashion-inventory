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

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

interface ChartDataPoint {
  name: string;
  value?: number;
  revenue?: number;
  cogs?: number;
  expenses?: number;
  profit?: number;
  quantity?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
  }>;
  label?: string;
}

const CustomTooltip = (props: TooltipProps) => {
  const { active, payload } = props;

  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.name }}>
            {entry.name}:{" "}
            {typeof entry.value === "number"
              ? entry.value.toFixed(0)
              : entry.value}{" "}
            EGP
          </p>
        ))}
      </div>
    );
  }

  return null;
};

const PieTooltip = (props: TooltipProps) => {
  const { active, payload } = props;

  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p>{payload[0].name}</p>
        <p className="font-bold">
          {typeof value === "number" ? value.toFixed(0) : value} EGP
        </p>
      </div>
    );
  }

  return null;
};

export default function DashboardPage() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return <p className="text-center py-8">⏳ جاري التحميل...</p>;
  }

  if (!analytics) {
    return <p className="text-center py-8">لا توجد بيانات</p>;
  }

  // Prepare data for Expenses Chart
  const expensesData: ChartDataPoint[] = analytics.expensesByCategory
    ? Object.entries(analytics.expensesByCategory).map(
        ([category, amount]: any) => ({
          name: category,
          value: typeof amount === "number" ? amount : 0,
        }),
      )
    : [];

  // Prepare data for Best Sellers
  const bestSellersData: ChartDataPoint[] = (analytics.bestSellers || []).map(
    (item: any) => ({
      name: item.name || "Unknown",
      quantity: typeof item.quantity === "number" ? item.quantity : 0,
    }),
  );

  // Prepare data for Revenue Summary
  const revenueSummaryData: ChartDataPoint[] = [
    {
      name: "المالية",
      revenue:
        typeof analytics.totalRevenue === "number" ? analytics.totalRevenue : 0,
      cogs: typeof analytics.totalCOGS === "number" ? analytics.totalCOGS : 0,
      expenses:
        typeof analytics.totalExpenses === "number"
          ? analytics.totalExpenses
          : 0,
      profit: typeof analytics.netProfit === "number" ? analytics.netProfit : 0,
    },
  ];

  const totalRevenue =
    typeof analytics.totalRevenue === "number" ? analytics.totalRevenue : 0;
  const totalExpenses =
    typeof analytics.totalExpenses === "number" ? analytics.totalExpenses : 0;
  const totalCOGS =
    typeof analytics.totalCOGS === "number" ? analytics.totalCOGS : 0;
  const netProfit =
    typeof analytics.netProfit === "number" ? analytics.netProfit : 0;
  const totalOrders =
    typeof analytics.totalOrders === "number" ? analytics.totalOrders : 0;

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const expenseRatio =
    totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">📊 لوحة التحكم</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow hover:shadow-lg transition">
          <p className="text-sm text-gray-600">الإيرادات (هذا الشهر)</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {totalRevenue.toFixed(0)} EGP
          </p>
          <p className="text-xs text-green-600 mt-1">📈 Revenue</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg shadow hover:shadow-lg transition">
          <p className="text-sm text-gray-600">المصاريف</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {totalExpenses.toFixed(0)} EGP
          </p>
          <p className="text-xs text-red-600 mt-1">💸 Expenses</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow hover:shadow-lg transition">
          <p className="text-sm text-gray-600">تكلفة البضاعة</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {totalCOGS.toFixed(0)} EGP
          </p>
          <p className="text-xs text-blue-600 mt-1">📦 COGS</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow hover:shadow-lg transition">
          <p className="text-sm text-gray-600">الربح الصافي</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {netProfit.toFixed(0)} EGP
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {profitMargin.toFixed(1)}% Margin
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">💰 ملخص المالية</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueSummaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="الإيرادات" />
              <Bar dataKey="cogs" fill="#3b82f6" name="COGS" />
              <Bar dataKey="expenses" fill="#ef4444" name="المصاريف" />
              <Bar dataKey="profit" fill="#8b5cf6" name="الربح" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">📊 توزيع المصاريف</h2>
          {expensesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name}: ${typeof value === "number" ? value.toFixed(0) : value} EGP`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesData.map((entry, index) => (
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
            <p className="text-gray-500 text-center py-16">لا توجد مصاريف</p>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">⭐ الأكثر مبيعاً</h2>
          {bestSellersData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bestSellersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="quantity" fill="#3b82f6" name="الكمية" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-16">لا توجد بيانات</p>
          )}
        </div>

        {/* Key Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">📈 المقاييس الرئيسية</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="font-medium">عدد الطلبات</span>
              <span className="text-2xl font-bold text-blue-600">
                {totalOrders}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="font-medium">متوسط قيمة الطلب</span>
              <span className="text-2xl font-bold text-green-600">
                {avgOrderValue.toFixed(0)} EGP
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
              <span className="font-medium">نسبة الربح</span>
              <span className="text-2xl font-bold text-purple-600">
                {profitMargin.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <span className="font-medium">المصاريف (نسبة)</span>
              <span className="text-2xl font-bold text-red-600">
                {expenseRatio.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
