import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge"; // or "nodejs" if you need Node APIs

// Use environment variables for Supabase secret key and URL
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const companyName = formData.get("companyName") as string;

    if (!file || !companyName) {
      return NextResponse.json({ error: "Missing file or companyName" }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop();
    const safeCompanyName = companyName.trim().replace(/\s+/g, "_");
    const fileName = `${safeCompanyName}-logo_${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(fileName, file.stream(), { upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("company-logos")
      .getPublicUrl(fileName);

    return NextResponse.json({ publicUrl: publicUrlData?.publicUrl || null });
  } catch (err: unknown) {
    console.error("Issue with company logo upload:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
