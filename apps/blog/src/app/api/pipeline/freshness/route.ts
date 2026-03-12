import { NextResponse } from "next/server";
import { getDataFreshness } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const freshness = await getDataFreshness();
    return NextResponse.json({ data: freshness, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[api/pipeline/freshness]", err);
    return NextResponse.json(
      { error: "Failed to fetch data freshness" },
      { status: 500 },
    );
  }
}
