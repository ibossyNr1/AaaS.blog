import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseJsonResponse } from "@/test/api-helpers";

// Mock the entities lib
vi.mock("@/lib/entities", () => ({
  getTrendingEntities: vi.fn(),
  getEntitiesByType: vi.fn(),
  getEntitiesByChannel: vi.fn(),
}));

import { GET } from "../route";
import {
  getTrendingEntities,
  getEntitiesByType,
  getEntitiesByChannel,
} from "@/lib/entities";

const mockGetTrending = vi.mocked(getTrendingEntities);
const mockGetByType = vi.mocked(getEntitiesByType);
const mockGetByChannel = vi.mocked(getEntitiesByChannel);

const sampleEntity = {
  slug: "gpt-4",
  name: "GPT-4",
  type: "model" as const,
  description: "Large language model by OpenAI",
  provider: "OpenAI",
  tags: ["llm", "gpt"],
  scores: { composite: 92 },
  addedDate: "2025-01-01",
};

describe("GET /api/entities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns trending entities when no filters are provided", async () => {
    mockGetTrending.mockResolvedValue([sampleEntity as never]);

    const req = createMockRequest("/api/entities");
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].slug).toBe("gpt-4");
    expect(json.count).toBe(1);
    expect(json.timestamp).toBeDefined();
    expect(mockGetTrending).toHaveBeenCalledWith(50);
  });

  it("filters by entity type when type param is provided", async () => {
    mockGetByType.mockResolvedValue([sampleEntity as never]);

    const req = createMockRequest("/api/entities", {
      searchParams: { type: "model" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(mockGetByType).toHaveBeenCalledWith("model", 50);
  });

  it("filters by channel when channel param is provided", async () => {
    mockGetByChannel.mockResolvedValue([]);

    const req = createMockRequest("/api/entities", {
      searchParams: { channel: "devops" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.data).toHaveLength(0);
    expect(json.count).toBe(0);
    expect(mockGetByChannel).toHaveBeenCalledWith("devops", 50);
  });

  it("respects the limit parameter capped at 100", async () => {
    mockGetTrending.mockResolvedValue([]);

    const req = createMockRequest("/api/entities", {
      searchParams: { limit: "200" },
    });
    await GET(req);

    expect(mockGetTrending).toHaveBeenCalledWith(100);
  });

  it("falls back to trending for invalid type values", async () => {
    mockGetTrending.mockResolvedValue([]);

    const req = createMockRequest("/api/entities", {
      searchParams: { type: "invalid" },
    });
    await GET(req);

    expect(mockGetTrending).toHaveBeenCalled();
    expect(mockGetByType).not.toHaveBeenCalled();
  });

  it("returns 500 when the data layer throws", async () => {
    mockGetTrending.mockRejectedValue(new Error("Firestore down"));

    const req = createMockRequest("/api/entities");
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(json.error).toBe("Failed to fetch entities");
  });
});
