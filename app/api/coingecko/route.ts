import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const apiKey = process.env.COINGECKO_API_KEY;
      
  const url = `https://api.coingecko.com/api/v3/coins/ethereum/history?date=${date}&localization=false`;

  try {
    const res = await fetch(url, apiKey
      ? { headers: { "x-cg-demo-api-key": apiKey, 'accept': 'application/json' } }
      : undefined
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching from Coingecko:", err);
    return NextResponse.json({ error: "Failed to fetch from Coingecko" }, { status: 500 });
  }
}
