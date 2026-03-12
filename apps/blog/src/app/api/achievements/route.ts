export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getUserAchievements,
  ACHIEVEMENTS,
} from "@/lib/achievements";

// ---------------------------------------------------------------------------
// GET — User's achievements (expects x-user-id header)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId || userId.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty x-user-id header." },
      { status: 401 },
    );
  }

  try {
    const userAchievements = await getUserAchievements(userId);

    // Enrich with full achievement metadata
    const enriched = ACHIEVEMENTS.map((achievement) => {
      const userProgress = userAchievements.find(
        (ua) => ua.achievementId === achievement.id,
      );

      return {
        ...achievement,
        unlocked: userProgress?.completed ?? false,
        unlockedAt: userProgress?.unlockedAt ?? null,
        progress: userProgress?.progress ?? 0,
      };
    });

    const totalPoints = enriched
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);

    const completedCount = enriched.filter((a) => a.unlocked).length;

    return NextResponse.json(
      {
        achievements: enriched,
        stats: {
          totalPoints,
          completedCount,
          totalCount: ACHIEVEMENTS.length,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
