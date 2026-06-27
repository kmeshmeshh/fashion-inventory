import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("inventory_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Inventory logs error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching logs" },
      { status: 500 },
    );
  }
}
