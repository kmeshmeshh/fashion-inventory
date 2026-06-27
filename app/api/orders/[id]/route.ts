import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// PATCH - update order
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await request.json();

    console.log("=== PATCH Order ===");
    console.log("Order ID:", id);
    console.log("Body:", body);

    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("orders")
      .update(body)
      .eq("id", orderId)
      .select();

    if (error) {
      console.error("Update error:", error);
      throw error;
    }

    console.log("Updated order:", data);
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("PATCH order error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error updating order",
      },
      { status: 500 },
    );
  }
}

// DELETE - delete order
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const id = params.id;

    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const supabase = supabaseServer();

    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE order error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error deleting order",
      },
      { status: 500 },
    );
  }
}
