import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const companyName = formData.get("companyName") as string;

    if (!file || !companyName) {
      return NextResponse.json({ error: "Missing file or companyName" }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop();
    const safeCompanyName = companyName.trim().replace(/\s+/g, "_").toLowerCase();
    const fileName = `${safeCompanyName}-logo_${Date.now()}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage with explicit content type
    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(fileName, fileData, {
        contentType: file.type || "image/*",
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
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