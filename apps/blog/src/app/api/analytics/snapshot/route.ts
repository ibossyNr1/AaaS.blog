import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "24h";

  if (!["24h", "7d", "30d"].includes(period)) {
    return NextResponse.json(
      { error: "Invalid period. Use 24h, 7d, or 30d." },
      { status: 400 },
    );
  }

  try {
    const snapshot = await getAnalyticsSnapshot(period as "24h" | "7d" | "30d");
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[api/analytics/snapshot] Error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
