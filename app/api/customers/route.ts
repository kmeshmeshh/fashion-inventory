import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("orders_count", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error fetching customers",
      },
      { status: 500 },
    );
  }
}
