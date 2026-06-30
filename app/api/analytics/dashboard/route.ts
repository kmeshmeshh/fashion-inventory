/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

function getDateRange(searchParams: URLSearchParams) {
  const range = searchParams.get("range") || "this_month";
  const now = new Date();

  if (range === "custom") {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) {
      return {
        start: new Date(`${from}T00:00:00`),
        end: new Date(`${to}T23:59:59`),
      };
    }
  }

  if (range === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }

  if (range === "all_time") {
    return {
      start: new Date(2000, 0, 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
  }

  // default: this_month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const { searchParams } = new URL(request.url);
    const { start, end } = getDateRange(searchParams);

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    // Get ALL orders in range (any status) - single source of truth
    const { data: allOrders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total_price, created_at, status")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    if (ordersError) throw ordersError;

    const deliveredOrders =
      allOrders?.filter((o) => o.status === "delivered") || [];

    const totalRevenue =
      deliveredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

    const totalOrders = deliveredOrders.length;

    const expectedIncome =
      allOrders
        ?.filter((o) => ["pending", "prepared", "shipped"].includes(o.status))
        .reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

    const cancelledAmount =
      allOrders
        ?.filter((o) => o.status === "cancelled")
        .reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

    const allOrdersCount = allOrders?.length || 0;

    // Get expenses
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("amount, category, date")
      .gte("date", startStr)
      .lte("date", endStr);

    if (expensesError) throw expensesError;

    const totalExpenses =
      expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    // Get order items with product costs - COGS (delivered only)
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
  id,
  quantity,
  orders!inner(
    created_at,
    status
  ),
  products(cost_per_unit)
`,
      )
      .gte("orders.created_at", start.toISOString())
      .lte("orders.created_at", end.toISOString());

    if (itemsError) throw itemsError;

    const totalCOGS =
      orderItems
        ?.filter((item: any) => item.orders?.status === "delivered")
        .reduce((sum: number, item: any) => {
          return sum + item.quantity * (item.products?.cost_per_unit || 0);
        }, 0) || 0;

    const netProfit = totalRevenue - totalCOGS - totalExpenses;

    // Total purchase cost = cost of stock still on hand + cost of stock already sold (delivered)
    // This answers "how much money have I spent buying inventory in total", regardless of what's sold yet.
    // NOTE: stock quantities live in `product_variants` (per size), not in `products.current_stock`
    // (that column isn't kept in sync), so we read quantity from variants and join cost_per_unit
    // from the parent product.
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("quantity, product_id, products(cost_per_unit)");

    if (variantsError) throw variantsError;

    const remainingStockValue =
      variants?.reduce((sum: number, v: any) => {
        const costPerUnit = v.products?.cost_per_unit || 0;
        return sum + (v.quantity || 0) * costPerUnit;
      }, 0) || 0;

    const totalPurchaseCost = remainingStockValue + totalCOGS;
    const totalSpending = totalPurchaseCost + totalExpenses;

    // Best sellers (delivered only)
    const { data: bestSellers } = await supabase
      .from("order_items")
      .select(
        `
      quantity,
      orders!inner(
        status,
        created_at
      ),
      products(name)
    `,
      )
      .gte("orders.created_at", start.toISOString())
      .lte("orders.created_at", end.toISOString())
      .eq("orders.status", "delivered")
      .order("quantity", { ascending: false })
      .limit(5);

    // Expenses breakdown
    const categoryBreakdown: any = {};
    expenses?.forEach((e) => {
      categoryBreakdown[e.category] =
        (categoryBreakdown[e.category] || 0) + e.amount;
    });

    return NextResponse.json({
      range: searchParams.get("range") || "this_month",
      from: startStr,
      to: endStr,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      expectedIncome: Math.round(expectedIncome * 100) / 100,
      cancelledAmount: Math.round(cancelledAmount * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalCOGS: Math.round(totalCOGS * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      remainingStockValue: Math.round(remainingStockValue * 100) / 100,
      totalPurchaseCost: Math.round(totalPurchaseCost * 100) / 100,
      totalSpending: Math.round(totalSpending * 100) / 100,
      totalOrders,
      allOrdersCount,
      bestSellers:
        bestSellers?.map((item: any) => ({
          name: item.products?.name || "Unknown",
          quantity: item.quantity,
        })) || [],
      expensesByCategory: categoryBreakdown,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error fetching analytics",
      },
      { status: 500 },
    );
  }
}