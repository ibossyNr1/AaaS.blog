/**
 * Personalized Discovery Suggestions API
 *
 * GET: Returns discovery suggestions for authenticated user (x-user-id header).
 * Falls back to trending entities for anonymous users.
 */

import { NextResponse } from "next/server";
import { collection, doc, getDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const dynamic = "force-dynamic";

interface Suggestion {
  type: string;
  slug: string;
  name: string;
  reason: string;
  score: number;
}

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");

    // Authenticated user — return personalized suggestions
    if (userId) {
      const suggestionsDoc = await getDoc(doc(db, "discovery_suggestions", userId));

      if (suggestionsDoc.exists()) {
        const data = suggestionsDoc.data();
        return NextResponse.json({
          personalized: true,
          suggestions: data.suggestions || [],
          generatedAt: data.generatedAt || null,
        });
      }
    }

    // Anonymous or no suggestions — fall back to trending
    const trendingSnap = await getDocs(
      query(
        collection(db, "trending_alerts"),
        orderBy("detectedAt", "desc"),
        limit(5),
      ),
    );

    const trending: Suggestion[] = trendingSnap.docs.map((d) => {
      const data = d.data();
      return {
        type: data.entityType || "tool",
        slug: data.entitySlug || d.id,
        name: data.entityName || d.id,
        reason: "trending now",
        score: data.scoreChange || 0,
      };
    });

    return NextResponse.json({
      personalized: false,
      suggestions: trending,
      generatedAt: null,
    });
  } catch (err) {
    console.error("[api/discover/suggestions] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 },
    );
  }
}
