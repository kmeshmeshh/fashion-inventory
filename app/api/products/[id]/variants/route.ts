import { productVariantCreateSchema } from "@/lib/apiTypes";
import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

async function refreshCurrentStock(
  supabase: ReturnType<typeof supabaseServer>,
  productId: number,
) {
  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .select("quantity")
    .eq("product_id", productId);

  if (variantError) throw variantError;

  const totalStock = (variants || []).reduce(
    (sum, variant) => sum + (variant.quantity ?? 0),
    0,
  );

  const { error: updateError } = await supabase
    .from("products")
    .update({ current_stock: totalStock })
    .eq("id", productId);

  if (updateError) throw updateError;
}

// GET variants for product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const id = params.id;
    const productId = parseInt(id, 10);

    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }

    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("size", { ascending: true });

    if (error) {
      console.error("GET variants - DB error:", error);
      return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("GET variants - Catch error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST - create/update variant
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await request.json();

    const productId = parseInt(id, 10);
    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        { error: `Invalid product ID: ${id}` },
        { status: 400 },
      );
    }

    const parseResult = productVariantCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: parseResult.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join(", "),
        },
        { status: 400 },
      );
    }

    const { size, quantity } = parseResult.data;
    const supabase = supabaseServer();

    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { data: existing, error: existingError } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId)
      .eq("size", size)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("product_variants")
        .update({ quantity })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;

      const { error: logError } = await supabase.from("inventory_logs").insert([
        {
          product_id: productId,
          quantity_changed: quantity,
          reason: "adjustment",
          reference_id: null,
        },
      ]);
      if (logError) throw logError;

      await refreshCurrentStock(supabase, productId);
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        size,
        quantity,
      })
      .select()
      .single();

    if (error) throw error;

    const { error: logError } = await supabase.from("inventory_logs").insert([
      {
        product_id: productId,
        quantity_changed: quantity,
        reason: "restock",
        reference_id: null,
      },
    ]);
    if (logError) throw logError;

    await refreshCurrentStock(supabase, productId);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST variant error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
