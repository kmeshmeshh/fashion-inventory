import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("shipping_cities")
      .select("id, city_name, shipping_fee")
      .order("city_name", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET shipping cities error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error fetching shipping cities",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cityName =
      typeof body.city_name === "string" ? body.city_name.trim() : "";
    const shippingFee = Number(body.shipping_fee);

    if (!cityName) {
      return NextResponse.json(
        { error: "city_name is required" },
        { status: 400 },
      );
    }

    if (Number.isNaN(shippingFee) || shippingFee < 0) {
      return NextResponse.json(
        { error: "shipping_fee must be a non-negative number" },
        { status: 400 },
      );
    }

    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("shipping_cities")
      .insert([{ city_name: cityName, shipping_fee: shippingFee }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST shipping city error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error creating shipping city",
      },
      { status: 500 },
    );
  }
}
