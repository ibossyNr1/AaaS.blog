import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseJsonResponse } from "@/test/api-helpers";

// Mock the workspaces lib
vi.mock("@/lib/workspaces", () => ({
  getUserWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
}));

import { GET, POST } from "../route";
import { getUserWorkspaces, createWorkspace } from "@/lib/workspaces";

const mockGetUserWorkspaces = vi.mocked(getUserWorkspaces);
const mockCreateWorkspace = vi.mocked(createWorkspace);

const sampleWorkspace = {
  id: "ws-1",
  name: "My Workspace",
  slug: "my-workspace",
  description: "Test workspace",
  ownerId: "user-123",
  plan: "free",
  settings: {
    isPublic: true,
    allowSubmissions: false,
    defaultDigestFrequency: "weekly",
    maxMembers: 5,
  },
  createdAt: "2026-01-01T00:00:00Z",
};

describe("GET /api/workspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns workspaces for an authenticated user", async () => {
    mockGetUserWorkspaces.mockResolvedValue([sampleWorkspace as never]);

    const req = createMockRequest("/api/workspaces", {
      headers: { "x-user-id": "user-123" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].name).toBe("My Workspace");
    expect(json.count).toBe(1);
    expect(json.timestamp).toBeDefined();
  });

  it("returns 401 when x-user-id header is missing", async () => {
    const req = createMockRequest("/api/workspaces");
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(401);
    expect(json.error).toContain("x-user-id");
  });

  it("returns empty array when user has no workspaces", async () => {
    mockGetUserWorkspaces.mockResolvedValue([]);

    const req = createMockRequest("/api/workspaces", {
      headers: { "x-user-id": "user-123" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.data).toHaveLength(0);
    expect(json.count).toBe(0);
  });

  it("returns 500 when the data layer throws", async () => {
    mockGetUserWorkspaces.mockRejectedValue(new Error("DB error"));

    const req = createMockRequest("/api/workspaces", {
      headers: { "x-user-id": "user-123" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(json.error).toBe("Failed to fetch workspaces");
  });
});

describe("POST /api/workspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a workspace with valid input", async () => {
    mockCreateWorkspace.mockResolvedValue(sampleWorkspace as never);

    const req = createMockRequest("/api/workspaces", {
      method: "POST",
      headers: { "x-user-id": "user-123" },
      body: { name: "My Workspace", slug: "my-workspace" },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(201);
    expect(json.data.name).toBe("My Workspace");
    expect(json.timestamp).toBeDefined();
    expect(mockCreateWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My Workspace",
        slug: "my-workspace",
        ownerId: "user-123",
      })
    );
  });

  it("returns 401 when x-user-id header is missing", async () => {
    const req = createMockRequest("/api/workspaces", {
      method: "POST",
      body: { name: "Test", slug: "test" },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(401);
    expect(json.error).toContain("x-user-id");
  });

  it("returns 400 when name or slug is missing", async () => {
    const req = createMockRequest("/api/workspaces", {
      method: "POST",
      headers: { "x-user-id": "user-123" },
      body: { name: "Test" },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("required");
  });

  it("rejects invalid slug format", async () => {
    const req = createMockRequest("/api/workspaces", {
      method: "POST",
      headers: { "x-user-id": "user-123" },
      body: { name: "Test", slug: "Invalid Slug!" },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("lowercase");
  });

  it("applies default settings when none provided", async () => {
    mockCreateWorkspace.mockResolvedValue(sampleWorkspace as never);

    const req = createMockRequest("/api/workspaces", {
      method: "POST",
      headers: { "x-user-id": "user-123" },
      body: { name: "Test", slug: "test" },
    });
    await POST(req);

    expect(mockCreateWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "free",
        settings: expect.objectContaining({
          isPublic: true,
          maxMembers: 5,
        }),
      })
    );
  });
});
