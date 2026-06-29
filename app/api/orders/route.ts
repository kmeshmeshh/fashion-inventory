/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          products (*)
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error fetching orders",
      },
      { status: 500 },
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_address,
      items,
      notes,
      shipped_with_courier,
    } = body;

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseServer().auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseServer();

    // 1. Validate inventory
    for (const item of items) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("quantity")
        .eq("product_id", item.product_id)
        .eq("size", item.size)
        .single();

      if (!variant || variant.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for size ${item.size}` },
          { status: 400 },
        );
      }
    }

    // 2. Generate order number
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    const order_number = `ORD-${String((count || 0) + 1).padStart(4, "0")}`;

    let total_price = 0;
    for (const item of items) {
      total_price += item.quantity * item.price_at_sale;
    }

    // 3. Create order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          order_number,
          customer_name,
          customer_phone,
          customer_address,
          total_price,
          notes,
          created_by: user.id,
          status: "pending",
        },
      ])
      .select();

    if (orderError) throw orderError;

    const orderId = orderData[0].id;

    // 4. Create order items (هنا التعديل الأساسي)
    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_sale: item.price_at_sale,
      size: item.size, // <--- ضفنا الـ size هنا عشان يتسجل في الداتابيز
      status: "pending",
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 5. DEDUCT FROM INVENTORY
    for (const item of items) {
      const { data: currentVariant } = await supabase
        .from("product_variants")
        .select("quantity")
        .eq("product_id", item.product_id)
        .eq("size", item.size)
        .single();

      const newQuantity = (currentVariant?.quantity || 0) - item.quantity;

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({ quantity: newQuantity })
        .eq("product_id", item.product_id)
        .eq("size", item.size);

      if (updateError) {
        await supabase.from("orders").delete().eq("id", orderId);
        throw new Error("Failed to deduct inventory");
      }
    }

    return NextResponse.json(orderData[0], { status: 201 });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 },
    );
  }
}
