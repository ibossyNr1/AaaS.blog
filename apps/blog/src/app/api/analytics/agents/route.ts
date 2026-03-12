import { NextResponse } from "next/server";
import { getAgentMetrics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await getAgentMetrics();
    return NextResponse.json(metrics);
  } catch (err) {
    console.error("[api/analytics/agents] Error:", err);
    return NextResponse.json({ error: "Failed to fetch agent metrics" }, { status: 500 });
  }
}
