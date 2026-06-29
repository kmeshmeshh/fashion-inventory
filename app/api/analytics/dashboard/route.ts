/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    // Get this month's date range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthStartStr = monthStart.toISOString().split("T")[0];
    const monthEndStr = monthEnd.toISOString().split("T")[0];

    console.log("Analytics - Month range:", monthStartStr, "to", monthEndStr);

    // Get ALL orders (not just delivered) - calculate revenue
    const { data: allOrders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total_price, created_at, status")
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString());

    if (ordersError) throw ordersError;

    const deliveredOrders =
      allOrders?.filter((o) => o.status === "delivered") || [];

    const totalRevenue =
      deliveredOrders.reduce((sum, o) => sum + o.total_price, 0) || 0;

    const totalOrders = deliveredOrders.length;
    console.log("Total Revenue:", totalRevenue, "Total Orders:", totalOrders);

    // Get expenses
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("amount, category, date")
      .gte("date", monthStartStr)
      .lte("date", monthEndStr);

    if (expensesError) throw expensesError;

    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

    console.log("Total Expenses:", totalExpenses);

    // Get order items with product costs - COGS
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
      .gte("orders.created_at", monthStart.toISOString())
      .lte("orders.created_at", monthEnd.toISOString());

    if (itemsError) throw itemsError;

    const totalCOGS =
      orderItems
        ?.filter((item: any) => item.orders?.status === "delivered")
        .reduce((sum: number, item: any) => {
          return sum + item.quantity * (item.products?.cost_per_unit || 0);
        }, 0) || 0;

    console.log("Total COGS:", totalCOGS);

    const netProfit = totalRevenue - totalCOGS - totalExpenses;

    console.log("Net Profit:", netProfit);

    // Best sellers
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
      .gte("orders.created_at", monthStart.toISOString())
      .lte("orders.created_at", monthEnd.toISOString())
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
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalCOGS: Math.round(totalCOGS * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      totalOrders,
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
