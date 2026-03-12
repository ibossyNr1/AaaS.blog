export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { semanticSearch } from "@/lib/pinecone";
import type { SemanticSearchResult } from "@/lib/pinecone";

// ---------------------------------------------------------------------------
// Keyword fallback — lightweight Firestore search when Pinecone is unavailable
// ---------------------------------------------------------------------------

async function keywordFallback(
  q: string,
  type: string,
  limit: number,
): Promise<{ data: SemanticSearchResult[]; fallback: true }> {
  try {
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (type) params.set("type", type);

    // Internal fetch to the existing keyword search route
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${origin}/api/search?${params}`, {
      headers: { "x-internal": "1" },
    });

    if (!res.ok) return { data: [], fallback: true };

    const json = await res.json();
    const data: SemanticSearchResult[] = (json.data ?? []).map(
      (e: { slug: string; type: string; name: string; scores?: { composite?: number }; category?: string; provider?: string; tags?: string[] }) => ({
        slug: e.slug,
        type: e.type,
        name: e.name,
        score: (e.scores?.composite ?? 0) / 100,
        metadata: {
          slug: e.slug,
          type: e.type,
          name: e.name,
          category: e.category ?? "",
          provider: e.provider ?? "",
          tags: e.tags ?? [],
          composite: e.scores?.composite ?? 0,
        },
      }),
    );
    return { data, fallback: true };
  } catch {
    return { data: [], fallback: true };
  }
}

// ---------------------------------------------------------------------------
// GET /api/search/semantic
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // Rate limiting
  const rl = await checkRateLimit(req);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: rl.error },
      { status: 429, headers: rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100) },
    );
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() || "";
  const type = searchParams.get("type") || "";
  const channel = searchParams.get("channel") || "";
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 },
    );
  }

  try {
    // Build Pinecone metadata filter
    const filter: Record<string, unknown> = {};
    if (type) filter.type = { $eq: type };
    if (channel) filter.category = { $eq: channel };

    const results = await semanticSearch(q, { topK: limit, filter });

    // If Pinecone returned nothing, fall back to keyword search
    if (results.length === 0) {
      const fallback = await keywordFallback(q, type, limit);
      return NextResponse.json(
        {
          data: fallback.data,
          count: fallback.data.length,
          query: q,
          mode: "keyword-fallback",
          filters: { type: type || null, channel: channel || null },
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            ...rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100),
            "Cache-Control": "public, max-age=30",
          },
        },
      );
    }

    return NextResponse.json(
      {
        data: results,
        count: results.length,
        query: q,
        mode: "semantic",
        filters: { type: type || null, channel: channel || null },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          ...rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100),
          "Cache-Control": "public, max-age=30",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Semantic search failed" },
      { status: 500 },
    );
  }
}
