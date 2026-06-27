import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET variants for product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // ✅ AWAIT the params!
    const params = await context.params;
    const id = params.id;

    console.log("GET variants - Raw ID:", id);
    const productId = parseInt(id, 10);
    console.log("GET variants - Parsed ID:", productId);

    if (isNaN(productId) || productId <= 0) {
      console.log("GET variants - Invalid ID");
      return NextResponse.json([]);
    }

    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("size", { ascending: true });

    if (error) {
      console.error("GET variants - DB error:", error);
      return NextResponse.json([]);
    }

    console.log("GET variants - Found:", data?.length || 0, "variants");
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("GET variants - Catch error:", error);
    return NextResponse.json([]);
  }
}

// POST - create/update variant
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // ✅ AWAIT the params!
    const params = await context.params;
    const id = params.id;
    const body = await request.json();

    console.log("=== POST VARIANT ===");
    console.log("Raw ID:", id);
    console.log("Body:", body);

    const productId = parseInt(id, 10);
    console.log("Parsed productId:", productId);

    const { size, quantity } = body;

    // Validate
    if (isNaN(productId) || productId <= 0) {
      console.log("Invalid productId");
      return NextResponse.json(
        { error: `Invalid product ID: ${id}` },
        { status: 400 },
      );
    }

    if (!size || quantity === undefined) {
      console.log("Missing size or quantity");
      return NextResponse.json(
        { error: "Missing size or quantity" },
        { status: 400 },
      );
    }

    const qty = parseInt(String(quantity), 10);

    if (isNaN(qty) || qty < 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Check existing
    console.log(
      "Checking for existing variant with product_id:",
      productId,
      "size:",
      size,
    );

    const { data: existing } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId)
      .eq("size", size)
      .maybeSingle();

    console.log("Existing variant:", existing?.id || "None");

    if (existing?.id) {
      // UPDATE
      console.log("Updating variant...");
      const { data, error } = await supabase
        .from("product_variants")
        .update({ quantity: qty })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;

      console.log("Updated:", data);
      return NextResponse.json(data);
    } else {
      // INSERT
      console.log("Creating new variant...");
      const { data, error } = await supabase
        .from("product_variants")
        .insert({
          product_id: productId,
          size,
          quantity: qty,
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Created:", data);
      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
