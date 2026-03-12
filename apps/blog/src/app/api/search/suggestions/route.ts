export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import type { Entity } from "@/lib/types";

const ALL_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

interface Suggestion {
  name: string;
  type: string;
  slug: string;
}

/**
 * GET /api/search/suggestions?q=prefix
 *
 * Returns top 8 autocomplete suggestions based on name prefix matching.
 * Used by the command palette for fast typeahead.
 */
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: rl.error },
      { status: 429, headers: rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100) },
    );
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.toLowerCase().trim() || "";

  if (!q || q.length < 1) {
    return NextResponse.json(
      { data: [], count: 0 },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  }

  try {
    const allEntities: Entity[] = [];
    const perCollection = Math.ceil(100 / ALL_COLLECTIONS.length);

    await Promise.all(
      ALL_COLLECTIONS.map(async (col) => {
        const snap = await getDocs(
          query(
            collection(db, col),
            orderBy("scores.composite", "desc"),
            firestoreLimit(perCollection),
          ),
        );
        for (const d of snap.docs) {
          allEntities.push({ slug: d.id, ...d.data() } as Entity);
        }
      }),
    );

    // Match on name only, prioritize startsWith over includes
    const suggestions: (Suggestion & { _priority: number })[] = [];

    for (const entity of allEntities) {
      const name = entity.name.toLowerCase();
      if (name.startsWith(q)) {
        suggestions.push({
          name: entity.name,
          type: entity.type,
          slug: entity.slug,
          _priority: 100 + (entity.scores?.composite ?? 0),
        });
      } else if (name.includes(q)) {
        suggestions.push({
          name: entity.name,
          type: entity.type,
          slug: entity.slug,
          _priority: 50 + (entity.scores?.composite ?? 0),
        });
      }
    }

    suggestions.sort((a, b) => b._priority - a._priority);

    const data: Suggestion[] = suggestions
      .slice(0, 8)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ _priority, ...rest }) => rest);

    return NextResponse.json(
      { data, count: data.length },
      {
        headers: {
          ...rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100),
          "Cache-Control": "public, max-age=60",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Suggestions failed" },
      { status: 500 },
    );
  }
}
