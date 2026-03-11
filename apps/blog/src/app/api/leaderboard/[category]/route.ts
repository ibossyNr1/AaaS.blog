import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/entities";
import type { EntityType } from "@/lib/types";

const VALID_CATEGORIES = new Set(["all", "tool", "model", "agent", "skill", "script", "benchmark"]);

export async function GET(
  req: NextRequest,
  { params }: { params: { category: string } },
) {
  const { category } = params;

  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: `Invalid category "${category}". Must be one of: ${Array.from(VALID_CATEGORIES).join(", ")}` },
      { status: 400 },
    );
  }

  const { searchParams } = req.nextUrl;
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 25), 1), 100);

  try {
    const entities = await getLeaderboard(category as EntityType | "all", limit);

    return NextResponse.json({
      data: entities,
      category,
      count: entities.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
