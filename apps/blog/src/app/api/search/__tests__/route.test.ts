import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseJsonResponse } from "@/test/api-helpers";

// Mock dependencies
const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn();

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 99,
    limit: 100,
  }),
  rateLimitHeaders: vi.fn(() => ({
    "X-RateLimit-Remaining": "99",
    "X-RateLimit-Limit": "100",
  })),
}));

vi.mock("@/lib/pinecone", () => ({
  semanticSearch: vi.fn().mockResolvedValue([]),
}));

import { GET } from "../route";

const makeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
});

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: "log-1" });
  });

  it("returns matching entities for a query", async () => {
    const entityData = {
      name: "GPT-4",
      type: "model",
      description: "Large language model",
      provider: "OpenAI",
      tags: ["llm"],
      scores: { composite: 92 },
      addedDate: "2025-01-01",
    };

    // Mock getDocs — called once per collection (6 collections)
    mockGetDocs.mockResolvedValue({
      docs: [makeDoc("gpt-4", entityData)],
    });

    const req = createMockRequest("/api/search", {
      searchParams: { q: "gpt" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.query).toBe("gpt");
    expect(json.count).toBeDefined();
    expect(json.timestamp).toBeDefined();
  });

  it("returns 400 when query parameter q is missing", async () => {
    const req = createMockRequest("/api/search");
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("Missing required query parameter: q");
  });

  it("returns 400 for invalid sort parameter", async () => {
    const req = createMockRequest("/api/search", {
      searchParams: { q: "test", sort: "invalid" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("Invalid sort");
  });

  it("filters by type when type param is provided", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        makeDoc("gpt-4", {
          name: "GPT-4",
          type: "model",
          description: "LLM",
          provider: "OpenAI",
          tags: ["llm"],
          scores: { composite: 92 },
          addedDate: "2025-01-01",
        }),
      ],
    });

    const req = createMockRequest("/api/search", {
      searchParams: { q: "gpt", type: "model" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.filters.type).toBe("model");
  });

  it("returns empty results for non-matching query", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        makeDoc("gpt-4", {
          name: "GPT-4",
          type: "model",
          description: "LLM",
          provider: "OpenAI",
          tags: ["llm"],
          scores: { composite: 92 },
          addedDate: "2025-01-01",
        }),
      ],
    });

    const req = createMockRequest("/api/search", {
      searchParams: { q: "zzzznothing" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.data).toHaveLength(0);
    expect(json.count).toBe(0);
  });

  it("includes filter metadata in response", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const req = createMockRequest("/api/search", {
      searchParams: { q: "test", type: "tool", channel: "devops", sort: "newest" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.filters).toEqual({
      type: "tool",
      channel: "devops",
      sort: "newest",
    });
  });

  it("returns 500 when firestore throws", async () => {
    mockGetDocs.mockRejectedValue(new Error("Firestore down"));

    const req = createMockRequest("/api/search", {
      searchParams: { q: "test" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(json.error).toBe("Search failed");
  });
});
