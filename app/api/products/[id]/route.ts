import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET single product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const id = params.id;

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }

    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        product_variants (*)
      `,
      )
      .eq("id", productId)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET product error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error fetching product",
      },
      { status: 500 },
    );
  }
}

// PATCH - update product
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await request.json();

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }

    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("products")
      .update(body)
      .eq("id", productId)
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("PATCH product error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error updating product",
      },
      { status: 500 },
    );
  }
}

// DELETE - delete product & variants
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const id = params.id;

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }

    const supabase = supabaseServer();

    // Delete variants first (due to foreign key)
    const { error: variantError } = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId);

    if (variantError) throw variantError;

    // Then delete product
    const { error: productError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (productError) throw productError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE product error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error deleting product",
      },
      { status: 500 },
    );
  }
}
