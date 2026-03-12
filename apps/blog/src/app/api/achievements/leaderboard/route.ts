export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getLeaderboardByPoints } from "@/lib/achievements";

// ---------------------------------------------------------------------------
// GET — Top users by achievement points
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "25", 10),
      100,
    );

    const leaderboard = await getLeaderboardByPoints(limit);

    return NextResponse.json({ leaderboard }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
