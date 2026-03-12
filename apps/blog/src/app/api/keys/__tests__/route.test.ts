import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseJsonResponse } from "@/test/api-helpers";

// Mock firebase-admin
const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockWhere = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnThis();

vi.mock("firebase-admin/app", () => ({
  getApps: vi.fn(() => [{ name: "mock" }]),
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      add: mockAdd,
      where: mockWhere,
      orderBy: mockOrderBy,
      get: mockGet,
    })),
  })),
}));

// Import route handlers after mocks are set up
import { GET, POST } from "../route";

describe("POST /api/keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdd.mockResolvedValue({ id: "key-doc-123" });
  });

  it("creates a new API key with valid input", async () => {
    const req = createMockRequest("/api/keys", {
      method: "POST",
      body: {
        name: "My App",
        email: "dev@example.com",
        description: "Testing key",
      },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(201);
    expect(json.id).toBe("key-doc-123");
    expect(json.key).toMatch(/^aaas_/);
    expect(json.keyPrefix).toHaveLength(8);
    expect(json.name).toBe("My App");
    expect(json.rateLimit).toBe(100);
    expect(json.createdAt).toBeDefined();
  });

  it("rejects when name is too short", async () => {
    const req = createMockRequest("/api/keys", {
      method: "POST",
      body: { name: "ab", email: "dev@example.com" },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("Name is required");
  });

  it("rejects when email is missing or invalid", async () => {
    const req = createMockRequest("/api/keys", {
      method: "POST",
      body: { name: "Valid Name", email: "not-an-email" },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("valid email");
  });

  it("rejects invalid JSON body", async () => {
    const fullUrl = new URL("/api/keys", "http://localhost:3000");
    const req = new Request(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{{{",
    });
    // Use NextRequest constructor
    const { NextRequest } = await import("next/server");
    const nextReq = new NextRequest(req);
    const res = await POST(nextReq);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toBe("Invalid JSON body.");
  });
});

describe("GET /api/keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns keys for a valid email", async () => {
    mockGet.mockResolvedValue({
      docs: [
        {
          id: "key-1",
          data: () => ({
            keyPrefix: "aaas_abc",
            name: "My Key",
            status: "active",
            requestCount: 42,
            rateLimit: 100,
            createdAt: "2025-01-01T00:00:00Z",
            lastUsedAt: null,
          }),
        },
      ],
    });

    const req = createMockRequest("/api/keys", {
      searchParams: { email: "dev@example.com" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.keys).toHaveLength(1);
    expect(json.keys[0].id).toBe("key-1");
    expect(json.keys[0].name).toBe("My Key");
  });

  it("rejects when email query param is missing", async () => {
    const req = createMockRequest("/api/keys");
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("email");
  });

  it("rejects when email is invalid", async () => {
    const req = createMockRequest("/api/keys", {
      searchParams: { email: "nope" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("email");
  });

  it("returns empty keys array when none exist", async () => {
    mockGet.mockResolvedValue({ docs: [] });

    const req = createMockRequest("/api/keys", {
      searchParams: { email: "nobody@example.com" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.keys).toHaveLength(0);
  });
});
