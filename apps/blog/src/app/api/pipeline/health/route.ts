import { NextResponse } from "next/server";
import { getPipelineHealth } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await getPipelineHealth();
    return NextResponse.json(health);
  } catch (err) {
    console.error("[api/pipeline/health]", err);
    return NextResponse.json(
      { error: "Failed to fetch pipeline health" },
      { status: 500 },
    );
  }
}
