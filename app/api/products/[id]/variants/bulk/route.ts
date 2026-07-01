import { productVariantBulkCreateSchema } from "@/lib/apiTypes";
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

async function getCurrentUserId(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: userError } =
      await supabaseServer().auth.getUser(token);
    if (!userError && authData.user) {
      return authData.user.id;
    }
  }

  try {
    const { data: users, error } = await supabaseServer()
      .from("users")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    if (!error && users?.[0]?.id) {
      return users[0].id;
    }
  } catch {
    // ignore fallback failure
  }

  return null;
}

async function upsertProductVariant(
  supabase: ReturnType<typeof supabaseServer>,
  productId: number,
  size: string,
  quantity: number,
  createdBy: string | null,
) {
  const { data: existing, error: existingError } = await supabase
    .from("product_variants")
    .select("id, quantity")
    .eq("product_id", productId)
    .eq("size", size)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const previousQuantity = existing.quantity ?? 0;
    const { data, error } = await supabase
      .from("product_variants")
      .update({ quantity })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    const delta = quantity - previousQuantity;
    if (delta !== 0 && createdBy) {
      const { error: logError } = await supabase.from("inventory_logs").insert([
        {
          product_id: productId,
          quantity_changed: delta,
          reason: "adjustment",
          reference_id: null,
          created_by: createdBy,
        },
      ]);

      if (logError) throw logError;
    }

    return data;
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

  if (quantity !== 0 && createdBy) {
    const { error: logError } = await supabase.from("inventory_logs").insert([
      {
        product_id: productId,
        quantity_changed: quantity,
        reason: "restock",
        reference_id: null,
        created_by: createdBy,
      },
    ]);

    if (logError) throw logError;
  }

  return data;
}

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

    const parseResult = productVariantBulkCreateSchema.safeParse(body);
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

    const variants = parseResult.data;
    const supabase = supabaseServer();
    const createdBy = await getCurrentUserId(request);

    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const results = [];
    for (const variant of variants) {
      const data = await upsertProductVariant(
        supabase,
        productId,
        variant.size,
        variant.quantity,
        createdBy,
      );
      results.push(data);
    }

    await refreshCurrentStock(supabase, productId);

    return NextResponse.json({ success: true, variants: results }, { status: 200 });
  } catch (error) {
    console.error("POST bulk variant error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    );
  }
}
