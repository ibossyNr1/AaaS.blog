export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

/* ------------------------------------------------------------------ */
/*  Static suggestion templates                                        */
/* ------------------------------------------------------------------ */

const POPULAR_QUERIES = [
  "Compare Claude vs GPT-5",
  "Compare the top 3 AI coding assistants",
  "Best tools for RAG pipelines",
  "What's the best vector database for production use?",
  "Show me trending models this week",
  "Which tools integrate with LangChain?",
  "What are the top AI agents?",
  "Explain how Pinecone works",
  "Best open-source LLMs available",
  "Compare embedding models",
  "What skills do I need for agent building?",
  "Show me the latest benchmarks",
  "Best tools for prompt engineering",
  "What's new in AI infrastructure?",
  "Compare AI coding tools",
  "Top models for code generation",
  "Which agents are fully autonomous?",
  "Best free AI tools",
  "Show me AI safety benchmarks",
  "Compare speech-to-text models",
];

/* ------------------------------------------------------------------ */
/*  Keyword-based matching for partial queries                         */
/* ------------------------------------------------------------------ */

const KEYWORD_EXPANSIONS: Record<string, string[]> = {
  compare: [
    "Compare Claude vs GPT-5",
    "Compare the top 3 AI coding assistants",
    "Compare embedding models",
    "Compare AI coding tools",
    "Compare speech-to-text models",
  ],
  best: [
    "Best tools for RAG pipelines",
    "Best open-source LLMs available",
    "Best tools for prompt engineering",
    "Best free AI tools",
    "What's the best vector database for production use?",
  ],
  trending: [
    "Show me trending models this week",
    "What's trending in AI agents?",
    "Show me trending tools",
  ],
  agent: [
    "What are the top AI agents?",
    "Which agents are fully autonomous?",
    "What skills do I need for agent building?",
  ],
  model: [
    "Best open-source LLMs available",
    "Top models for code generation",
    "Compare embedding models",
    "Show me trending models this week",
  ],
  tool: [
    "Best tools for RAG pipelines",
    "Best tools for prompt engineering",
    "Best free AI tools",
    "Which tools integrate with LangChain?",
  ],
  benchmark: [
    "Show me the latest benchmarks",
    "Show me AI safety benchmarks",
  ],
  code: [
    "Compare AI coding tools",
    "Top models for code generation",
    "Compare the top 3 AI coding assistants",
  ],
  explain: [
    "Explain how Pinecone works",
    "What are the top AI agents?",
    "What skills do I need for agent building?",
  ],
  new: [
    "What's new in AI infrastructure?",
    "Show me the latest benchmarks",
    "Show me trending models this week",
  ],
};

/* ------------------------------------------------------------------ */
/*  GET /api/ai/suggest?q=partial                                      */
/* ------------------------------------------------------------------ */

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
    // Return popular queries as defaults
    return NextResponse.json(
      { data: POPULAR_QUERIES.slice(0, 6), count: 6 },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  }

  // Match against keyword expansions
  const suggestions = new Set<string>();

  // Check keyword expansions
  for (const [keyword, queries] of Object.entries(KEYWORD_EXPANSIONS)) {
    if (keyword.startsWith(q) || q.includes(keyword)) {
      for (const query of queries) {
        suggestions.add(query);
      }
    }
  }

  // Also match popular queries by substring
  for (const pq of POPULAR_QUERIES) {
    if (pq.toLowerCase().includes(q)) {
      suggestions.add(pq);
    }
  }

  // If no matches, return generic suggestions
  if (suggestions.size === 0) {
    const fallback = [
      `Compare the best ${q} tools`,
      `What are the top ${q} models?`,
      `Show me ${q} related entities`,
    ];
    return NextResponse.json(
      { data: fallback, count: fallback.length },
      {
        headers: {
          ...rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100),
          "Cache-Control": "public, max-age=60",
        },
      },
    );
  }

  const data = Array.from(suggestions).slice(0, 6);

  return NextResponse.json(
    { data, count: data.length },
    {
      headers: {
        ...rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100),
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
