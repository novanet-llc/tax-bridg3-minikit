import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use environment variables for Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY!;

// Use the service role key to allow inserts from the backend only
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.wallet_address) {
      return NextResponse.json({ error: "wallet_address is required" }, { status: 400 });
    }
    // Insert company profile into Supabase
    const { error } = await supabase
      .from("company_profiles")
      .insert([body]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error inserting company profile:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Fetch company profile(s) by wallet_address if provided
  try {
    const { searchParams } = new URL(req.url);
    const wallet_address = searchParams.get("wallet_address");

    let query = supabase.from("company_profiles").select("*");
    if (wallet_address) {
      query = query.eq("wallet_address", wallet_address);
    }
    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ companies: data });
  } catch (err: unknown) {
    console.error("Error fetching company profile:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
