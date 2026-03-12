import { NextRequest, NextResponse } from "next/server";
import { getEntityTimeSeries } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const type = searchParams.get("type");
  const metric = searchParams.get("metric") || "score";
  const days = parseInt(searchParams.get("days") || "30", 10);

  if (!slug || !type) {
    return NextResponse.json(
      { error: "Missing required params: slug, type" },
      { status: 400 },
    );
  }

  if (days < 1 || days > 365) {
    return NextResponse.json(
      { error: "Days must be between 1 and 365" },
      { status: 400 },
    );
  }

  try {
    const series = await getEntityTimeSeries(slug, type, metric, days);
    return NextResponse.json(series);
  } catch (err) {
    console.error("[api/analytics/timeseries] Error:", err);
    return NextResponse.json({ error: "Failed to fetch time series" }, { status: 500 });
  }
}
