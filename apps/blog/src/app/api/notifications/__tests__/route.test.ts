import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseJsonResponse } from "@/test/api-helpers";

// Mock firebase/firestore
const mockGetDocs = vi.fn();

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
  Timestamp: {
    fromMillis: vi.fn((ms: number) => ({
      toMillis: () => ms,
      toDate: () => new Date(ms),
    })),
  },
}));

import { GET } from "../route";

const makeDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
});

const makeTimestamp = (iso: string) => ({
  toDate: () => new Date(iso),
});

describe("GET /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns notifications from all three sources", async () => {
    const trendingDocs = [
      makeDoc("t1", {
        entityType: "model",
        entitySlug: "gpt-4",
        entityName: "GPT-4",
        direction: "up",
        metric: "Score",
        delta: 5,
        detectedAt: makeTimestamp("2026-03-12T10:00:00Z"),
      }),
    ];
    const agentDocs = [
      makeDoc("a1", {
        agent: "scraper",
        action: "fetch",
        details: "timeout",
        timestamp: makeTimestamp("2026-03-12T09:00:00Z"),
      }),
    ];
    const submissionDocs = [
      makeDoc("s1", {
        name: "NewTool",
        status: "pending",
        type: "tool",
        submittedAt: makeTimestamp("2026-03-12T08:00:00Z"),
      }),
    ];

    mockGetDocs
      .mockResolvedValueOnce({ docs: trendingDocs })
      .mockResolvedValueOnce({ docs: agentDocs })
      .mockResolvedValueOnce({ docs: submissionDocs });

    const req = createMockRequest("/api/notifications");
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json).toHaveLength(3);
    expect(json[0].type).toBe("score_change");
    expect(json[1].type).toBe("agent_failure");
    expect(json[2].type).toBe("submission_update");
  });

  it("returns empty array when no notifications exist", async () => {
    mockGetDocs
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    const req = createMockRequest("/api/notifications");
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json).toHaveLength(0);
  });

  it("filters trending notifications by watchlist", async () => {
    const trendingDocs = [
      makeDoc("t1", {
        entityType: "model",
        entitySlug: "gpt-4",
        entityName: "GPT-4",
        direction: "up",
        metric: "Score",
        delta: 5,
        detectedAt: makeTimestamp("2026-03-12T10:00:00Z"),
      }),
      makeDoc("t2", {
        entityType: "tool",
        entitySlug: "langchain",
        entityName: "LangChain",
        direction: "down",
        metric: "Score",
        delta: -3,
        detectedAt: makeTimestamp("2026-03-12T09:30:00Z"),
      }),
    ];

    mockGetDocs
      .mockResolvedValueOnce({ docs: trendingDocs })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    const req = createMockRequest("/api/notifications", {
      searchParams: { watchlist: "model:gpt-4" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    // Only the GPT-4 trending notification should pass the watchlist filter
    const scoreChanges = json.filter((n: { type: string }) => n.type === "score_change");
    expect(scoreChanges).toHaveLength(1);
    expect(scoreChanges[0].id).toBe("trending-t1");
  });

  it("sorts notifications by timestamp descending", async () => {
    const trendingDocs = [
      makeDoc("t1", {
        entityType: "model",
        entitySlug: "gpt-4",
        entityName: "GPT-4",
        detectedAt: makeTimestamp("2026-03-10T00:00:00Z"),
      }),
    ];
    const agentDocs = [
      makeDoc("a1", {
        agent: "scraper",
        action: "fetch",
        details: "timeout",
        timestamp: makeTimestamp("2026-03-12T12:00:00Z"),
      }),
    ];

    mockGetDocs
      .mockResolvedValueOnce({ docs: trendingDocs })
      .mockResolvedValueOnce({ docs: agentDocs })
      .mockResolvedValueOnce({ docs: [] });

    const req = createMockRequest("/api/notifications");
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    // Agent failure (Mar 12) should come before trending (Mar 10)
    expect(json[0].type).toBe("agent_failure");
    expect(json[1].type).toBe("score_change");
  });

  it("returns 500 when firestore throws", async () => {
    mockGetDocs.mockRejectedValue(new Error("Firestore down"));

    const req = createMockRequest("/api/notifications");
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(json.error).toBe("Failed to fetch notifications");
  });
});
