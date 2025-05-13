import { NextRequest, NextResponse } from "next/server";

const NETWORKS: Record<string, { apiBase: string }> = {
  mainnet: { apiBase: "https://api.etherscan.io" },
  sepolia: { apiBase: "https://api-sepolia.etherscan.io" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const networkKey = searchParams.get("network") || "mainnet";

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const network = NETWORKS[networkKey];
  if (!network) {
    return NextResponse.json({ error: "Invalid network" }, { status: 400 });
  }

  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ETHERSCAN_API_KEY not set" }, { status: 500 });
  }

  const url = `${network.apiBase}/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching from Etherscan:", err);
    return NextResponse.json({ error: "Failed to fetch from Etherscan" }, { status: 500 });
  }
}
