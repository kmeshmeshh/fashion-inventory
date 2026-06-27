import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET all products with variants
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        product_variants (
          id,
          size,
          quantity
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET products error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error fetching products",
      },
      { status: 500 },
    );
  }
}

// POST - create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sku, name, cost_per_unit, selling_price } = body;

    if (
      !sku ||
      !name ||
      cost_per_unit === undefined ||
      selling_price === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: sku, name, cost_per_unit, selling_price",
        },
        { status: 400 },
      );
    }

    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          sku,
          name,
          cost_per_unit: parseFloat(String(cost_per_unit)),
          selling_price: parseFloat(String(selling_price)),
          current_stock: 0,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("POST products error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error creating product",
      },
      { status: 500 },
    );
  }
}
