import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseJsonResponse } from "@/test/api-helpers";

// Mock the achievements lib
vi.mock("@/lib/achievements", () => ({
  getUserAchievements: vi.fn(),
  ACHIEVEMENTS: [
    {
      id: "first-look",
      name: "First Look",
      description: "View your first entity",
      icon: "eye",
      category: "explorer",
      tier: "bronze",
      requirement: { type: "entity_views", threshold: 1 },
      points: 10,
    },
    {
      id: "curious-mind",
      name: "Curious Mind",
      description: "View 10 entities",
      icon: "search",
      category: "explorer",
      tier: "bronze",
      requirement: { type: "entity_views", threshold: 10 },
      points: 25,
    },
  ],
}));

import { GET } from "../route";
import { getUserAchievements } from "@/lib/achievements";

const mockGetUserAchievements = vi.mocked(getUserAchievements);

describe("GET /api/achievements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns enriched achievements with progress for a user", async () => {
    mockGetUserAchievements.mockResolvedValue([
      {
        achievementId: "first-look",
        completed: true,
        unlockedAt: "2026-01-15T00:00:00Z",
        progress: 1,
      },
    ] as never);

    const req = createMockRequest("/api/achievements", {
      headers: { "x-user-id": "user-123" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.achievements).toHaveLength(2);

    // First achievement should be unlocked
    const firstLook = json.achievements.find(
      (a: { id: string }) => a.id === "first-look"
    );
    expect(firstLook.unlocked).toBe(true);
    expect(firstLook.unlockedAt).toBe("2026-01-15T00:00:00Z");
    expect(firstLook.progress).toBe(1);

    // Second should not be unlocked
    const curiousMind = json.achievements.find(
      (a: { id: string }) => a.id === "curious-mind"
    );
    expect(curiousMind.unlocked).toBe(false);
    expect(curiousMind.progress).toBe(0);
  });

  it("returns correct stats summary", async () => {
    mockGetUserAchievements.mockResolvedValue([
      {
        achievementId: "first-look",
        completed: true,
        unlockedAt: "2026-01-15T00:00:00Z",
        progress: 1,
      },
    ] as never);

    const req = createMockRequest("/api/achievements", {
      headers: { "x-user-id": "user-123" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.stats.totalPoints).toBe(10);
    expect(json.stats.completedCount).toBe(1);
    expect(json.stats.totalCount).toBe(2);
  });

  it("returns 401 when x-user-id header is missing", async () => {
    const req = createMockRequest("/api/achievements");
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(401);
    expect(json.error).toContain("x-user-id");
  });

  it("returns 401 when x-user-id header is empty", async () => {
    const req = createMockRequest("/api/achievements", {
      headers: { "x-user-id": "   " },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(401);
    expect(json.error).toContain("x-user-id");
  });

  it("returns zero stats when user has no achievements", async () => {
    mockGetUserAchievements.mockResolvedValue([]);

    const req = createMockRequest("/api/achievements", {
      headers: { "x-user-id": "new-user" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.stats.totalPoints).toBe(0);
    expect(json.stats.completedCount).toBe(0);
    expect(json.achievements.every((a: { unlocked: boolean }) => !a.unlocked)).toBe(true);
  });

  it("returns 500 when the data layer throws", async () => {
    mockGetUserAchievements.mockRejectedValue(new Error("DB error"));

    const req = createMockRequest("/api/achievements", {
      headers: { "x-user-id": "user-123" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(json.error).toBe("Internal server error.");
  });
});
