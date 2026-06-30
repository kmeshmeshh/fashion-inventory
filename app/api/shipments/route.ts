import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET all shipments with orders
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("shipments")
      .select(
        `
        *,
        shipment_orders (
          order_id,
          orders (
            order_number,
            customer_name,
            total_price,
            status,
            shipping_city:shipping_cities (
              city_name,
              shipping_fee
            )
          )
        )
      `,
      )
      .order("shipped_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET shipments error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error fetching shipments",
      },
      { status: 500 },
    );
  }
}

// POST - create shipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courier_name, tracking_number, order_ids } = body;

    if (!courier_name || !order_ids || order_ids.length === 0) {
      return NextResponse.json(
        { error: "Missing courier_name or order_ids" },
        { status: 400 },
      );
    }

    const supabase = supabaseServer();

    // Generate shipment number
    const { count } = await supabase
      .from("shipments")
      .select("*", { count: "exact", head: true });

    const shipment_number = `SHP-${String((count || 0) + 1).padStart(4, "0")}`;

    // Create shipment
    const { data: shipmentData, error: shipmentError } = await supabase
      .from("shipments")
      .insert([
        {
          shipment_number,
          courier_name,
          tracking_number: tracking_number || null,
          shipped_date: new Date().toISOString(),
        },
      ])
      .select();

    if (shipmentError) throw shipmentError;

    const shipmentId = shipmentData[0].id;

    // Link orders to shipment
    const shipmentOrders = order_ids.map((orderId: number) => ({
      shipment_id: shipmentId,
      order_id: orderId,
    }));

    const { error: linkError } = await supabase
      .from("shipment_orders")
      .insert(shipmentOrders);

    if (linkError) throw linkError;

    // Update orders status to shipped
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "shipped" })
      .in("id", order_ids);

    if (updateError) throw updateError;

    return NextResponse.json(shipmentData[0], { status: 201 });
  } catch (error) {
    console.error("POST shipment error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error creating shipment",
      },
      { status: 500 },
    );
  }
}
