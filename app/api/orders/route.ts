/* eslint-disable @typescript-eslint/no-explicit-any */
import { createOrderSchema } from "@/lib/apiTypes";
import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

async function rollbackOrder(
  supabase: ReturnType<typeof supabaseServer>,
  orderId: number,
  variantInventory?: Map<string, number>,
) {
  if (variantInventory && variantInventory.size) {
    for (const [key, originalQuantity] of variantInventory) {
      const [product_id, size] = key.split("-");
      await supabase
        .from("product_variants")
        .update({ quantity: originalQuantity })
        .eq("product_id", Number(product_id))
        .eq("size", size);
    }

    const productIds = new Set<number>();
    for (const key of variantInventory.keys()) {
      const [product_id] = key.split("-");
      productIds.add(Number(product_id));
    }

    for (const productId of productIds) {
      const { data: variants, error: variantError } = await supabase
        .from("product_variants")
        .select("quantity")
        .eq("product_id", productId);

      if (variantError) {
        console.error(
          "rollbackOrder: failed to refresh product stock",
          variantError,
        );
        continue;
      }

      const totalStock = (variants || []).reduce(
        (sum, variant) => sum + (variant.quantity ?? 0),
        0,
      );

      await supabase
        .from("products")
        .update({ current_stock: totalStock })
        .eq("id", productId);
    }
  }

  await supabase.from("order_items").delete().eq("order_id", orderId);
  await supabase
    .from("inventory_logs")
    .delete()
    .eq("reference_id", orderId)
    .eq("reason", "order");
  await supabase.from("orders").delete().eq("id", orderId);
}

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
        ),
        shipping_city:shipping_cities (
          id,
          city_name,
          shipping_fee
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
    const parseResult = createOrderSchema.safeParse(body);

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

    const {
      customer_name,
      customer_phone,
      customer_address,
      items,
      notes,
      shipped_with_courier,
      source,
      shipping_city_id,
      discount,
    } = parseResult.data;

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

    let customerId: number | null = null;
    if (customer_phone) {
      const { data: existingCustomer, error: findCustomerError } =
        await supabase
          .from("customers")
          .select("id, orders_count")
          .eq("phone", customer_phone)
          .maybeSingle();

      if (findCustomerError) throw findCustomerError;

      if (existingCustomer) {
        customerId = existingCustomer.id;
        const { error: updateCustomerError } = await supabase
          .from("customers")
          .update({ orders_count: (existingCustomer.orders_count || 0) + 1 })
          .eq("id", customerId);

        if (updateCustomerError) throw updateCustomerError;
      } else {
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from("customers")
          .insert([
            {
              name: customer_name,
              phone: customer_phone,
              address: customer_address || null,
              orders_count: 1,
            },
          ])
          .select()
          .single();

        if (newCustomerError) throw newCustomerError;
        customerId = newCustomer.id;
      }
    }

    const requiredVariantQuantities = new Map<
      string,
      {
        product_id: number;
        size: string;
        quantity: number;
      }
    >();

    const mergedItems = items.reduce((acc: any[], item: any) => {
      const existing = acc.find(
        (i) => i.product_id === item.product_id && i.size === item.size,
      );

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }

      return acc;
    }, []);

    for (const item of mergedItems) {
      const key = `${item.product_id}-${item.size}`;
      const existing = requiredVariantQuantities.get(key);
      requiredVariantQuantities.set(key, {
        product_id: item.product_id,
        size: item.size,
        quantity: (existing?.quantity || 0) + item.quantity,
      });
    }

    for (const {
      product_id,
      size,
      quantity,
    } of requiredVariantQuantities.values()) {
      const { data: variant, error: variantError } = await supabase
        .from("product_variants")
        .select("id, quantity")
        .eq("product_id", product_id)
        .eq("size", size)
        .maybeSingle();

      if (variantError) throw variantError;
      if (!variant || variant.quantity < quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for size ${size}` },
          { status: 400 },
        );
      }
    }

    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    const order_number = `ORD-${String((count || 0) + 1).padStart(4, "0")}`;

    const subtotal = mergedItems.reduce(
      (sum, item) => sum + item.quantity * item.price_at_sale,
      0,
    );

    const discountAmount = Number(discount) || 0;
    const total_price = Math.max(0, subtotal - discountAmount);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          order_number,
          customer_id: customerId,
          customer_name,
          customer_phone,
          customer_address,
          total_price,
          discount: discountAmount,
          source: source || null,
          shipping_city_id: shipping_city_id || null,
          notes,
          shipped_with_courier,
          created_by: user.id,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderId = orderData.id;

    const orderItems = mergedItems.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_sale: item.price_at_sale,
      size: item.size,
      status: "pending",
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      await rollbackOrder(supabase, orderId);
      throw itemsError;
    }

    const variantInventory = new Map<string, number>();
    for (const { product_id, size } of requiredVariantQuantities.values()) {
      const { data: variant, error: variantError } = await supabase
        .from("product_variants")
        .select("id, quantity")
        .eq("product_id", product_id)
        .eq("size", size)
        .maybeSingle();

      if (variantError) throw variantError;
      if (!variant) {
        await rollbackOrder(supabase, orderId);
        throw new Error(`Variant not found for size ${size}`);
      }

      variantInventory.set(`${product_id}-${size}`, variant.quantity);
    }

    const productIds = new Set<number>();

    for (const {
      product_id,
      size,
      quantity,
    } of requiredVariantQuantities.values()) {
      const key = `${product_id}-${size}`;
      const originalQuantity = variantInventory.get(key) ?? 0;
      const newQuantity = originalQuantity - quantity;

      if (newQuantity < 0) {
        await rollbackOrder(supabase, orderId, variantInventory);
        throw new Error(
          `Insufficient stock while deducting inventory for size ${size}`,
        );
      }

      const { data: updatedVariant, error: updateError } = await supabase
        .from("product_variants")
        .update({ quantity: newQuantity })
        .eq("product_id", product_id)
        .eq("size", size)
        .gte("quantity", quantity)
        .select()
        .single();

      if (updateError || !updatedVariant) {
        await rollbackOrder(supabase, orderId, variantInventory);
        throw new Error(`Failed to deduct inventory for size ${size}`);
      }

      productIds.add(product_id);

      const { error: logError } = await supabase.from("inventory_logs").insert([
        {
          product_id,
          quantity_changed: -quantity,
          reason: "order",
          reference_id: orderId,
          created_by: user.id,
        },
      ]);

      if (logError) {
        await rollbackOrder(supabase, orderId, variantInventory);
        throw logError;
      }
    }

    for (const productId of productIds) {
      const { data: variants, error: variantError } = await supabase
        .from("product_variants")
        .select("quantity")
        .eq("product_id", productId);

      if (variantError) {
        await rollbackOrder(supabase, orderId);
        throw variantError;
      }

      const totalStock = (variants || []).reduce(
        (sum, variant) => sum + (variant.quantity ?? 0),
        0,
      );

      const { error: updateError } = await supabase
        .from("products")
        .update({ current_stock: totalStock })
        .eq("id", productId);

      if (updateError) {
        await rollbackOrder(supabase, orderId);
        throw updateError;
      }
    }

    return NextResponse.json(orderData, { status: 201 });
  } catch (error) {
    console.error("ORDER ERROR FULL:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : JSON.stringify(error),
        details: error,
      },
      { status: 500 },
    );
  }
}
