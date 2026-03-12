export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSimilarUserStats } from "@/lib/collaborative";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ count: 0, topInterests: [] });
    }

    const stats = await getSimilarUserStats(userId);

    return NextResponse.json({
      count: stats.count,
      topInterests: stats.topInterests,
    });
  } catch (err) {
    console.error("[api/recommendations/similar-users] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch similar user stats" },
      { status: 500 }
    );
  }
}
