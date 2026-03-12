export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { processNaturalQuery } from "@/lib/ai-query";
import type { ConversationMessage } from "@/lib/ai-query";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

/* ------------------------------------------------------------------ */
/*  Stricter rate limits for AI queries                                */
/* ------------------------------------------------------------------ */

const AI_ANON_LIMIT = 50;
const AI_AUTH_LIMIT = 200;

/* ------------------------------------------------------------------ */
/*  Log query to Firestore                                             */
/* ------------------------------------------------------------------ */

async function logAIQuery(
  queryText: string,
  intent: string,
  entityCount: number,
  confidence: number,
  ip: string,
): Promise<void> {
  try {
    await addDoc(collection(db, "ai_queries"), {
      query: queryText,
      intent,
      entityCount,
      confidence,
      ipHash: ip.slice(0, 8) + "...",
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Never let logging fail the request
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/ai/query                                                 */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  // --- Rate limiting (reuses existing system, but we enforce stricter caps) ---
  const rl = await checkRateLimit(req);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: rl.error },
      { status: 429, headers: rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? AI_ANON_LIMIT) },
    );
  }

  // Enforce stricter AI-specific limits
  const isAuthenticated = !!req.headers.get("x-api-key");
  const effectiveLimit = isAuthenticated ? AI_AUTH_LIMIT : AI_ANON_LIMIT;
  if ((rl.remaining ?? 0) <= 0) {
    return NextResponse.json(
      {
        error: `AI query rate limit exceeded. Limit: ${effectiveLimit} requests/day.${
          !isAuthenticated ? " Provide an x-api-key header for higher limits." : ""
        }`,
      },
      { status: 429, headers: rateLimitHeaders(0, effectiveLimit) },
    );
  }

  // --- Parse body ---
  let body: { query?: string; conversationHistory?: ConversationMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const queryText = body.query?.trim();
  if (!queryText || queryText.length === 0) {
    return NextResponse.json(
      { error: "Missing required field: query" },
      { status: 400 },
    );
  }

  if (queryText.length > 500) {
    return NextResponse.json(
      { error: "Query too long. Maximum 500 characters." },
      { status: 400 },
    );
  }

  // Validate conversation history if provided
  const history = Array.isArray(body.conversationHistory)
    ? body.conversationHistory.slice(-10) // Keep last 10 messages max
    : undefined;

  try {
    const result = await processNaturalQuery(queryText, history);

    // Log asynchronously
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    logAIQuery(queryText, "processed", result.entities.length, result.confidence, ip);

    return NextResponse.json(
      {
        ...result,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          ...rateLimitHeaders(rl.remaining ?? 0, effectiveLimit),
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "AI query processing failed" },
      { status: 500 },
    );
  }
}
