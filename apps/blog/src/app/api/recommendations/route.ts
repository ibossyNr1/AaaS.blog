export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getCollaborativeRecommendations,
  getPopularAmongSimilar,
  getTrendingFallback,
} from "@/lib/collaborative";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = req.headers.get("x-user-id");
    const entityType = searchParams.get("type") || undefined;
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "10", 10),
      30
    );

    // Anonymous users get trending fallback
    if (!userId) {
      const trending = await getTrendingFallback(entityType, limit);
      return NextResponse.json({
        recommendations: trending,
        source: "trending",
      });
    }

    // Authenticated users get collaborative filtering
    const recommendations = entityType
      ? await getPopularAmongSimilar(userId, entityType)
      : await getCollaborativeRecommendations(userId, limit);

    // If collaborative filtering returns nothing, fall back to trending
    if (recommendations.length === 0) {
      const trending = await getTrendingFallback(entityType, limit);
      return NextResponse.json({
        recommendations: trending,
        source: "trending-fallback",
      });
    }

    return NextResponse.json({
      recommendations: recommendations.slice(0, limit),
      source: "collaborative",
    });
  } catch (err) {
    console.error("[api/recommendations] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
