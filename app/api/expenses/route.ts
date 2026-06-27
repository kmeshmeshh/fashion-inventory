import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET all expenses
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET expenses error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error fetching expenses",
      },
      { status: 500 },
    );
  }
}

// POST - create expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, amount, description, date } = body;

    if (!category || !amount || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get auth user
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseAuth = supabaseServer();
      const { data: authData } = await supabaseAuth.auth.getUser(token);
      userId = authData.user?.id || null;
    }

    // If no token, use a default/anonymous user (optional)
    if (!userId) {
      // Get first admin user as fallback
      const supabase = supabaseServer();
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1);

      userId = users?.[0]?.id || null;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "No authenticated user" },
        { status: 401 },
      );
    }

    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from("expenses")
      .insert([
        {
          category,
          amount: parseFloat(String(amount)),
          description: description || null,
          date,
          created_by: userId,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("POST expense error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error creating expense",
      },
      { status: 500 },
    );
  }
}
