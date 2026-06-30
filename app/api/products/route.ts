import { createProductSchema } from "@/lib/apiTypes";
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
    const parseResult = createProductSchema.safeParse(body);

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

    const product = parseResult.data;
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          ...product,
          current_stock: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
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
