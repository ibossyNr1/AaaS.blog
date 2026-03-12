import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseJsonResponse } from "@/test/api-helpers";

// Mock firebase/firestore
const mockAddDoc = vi.fn();

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
}));

vi.mock("@/lib/webhooks-v2", () => ({
  VALID_WEBHOOK_EVENTS_V2: [
    "entity.created",
    "entity.updated",
    "entity.deleted",
    "score.changed",
    "trending.detected",
    "digest.published",
    "anomaly.detected",
    "submission.received",
    "submission.approved",
  ],
  DEFAULT_RETRY_POLICY: {
    maxRetries: 5,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
  generateWebhookSecret: vi.fn(() => "whsec_mock_secret_123"),
  getWebhooksForUser: vi.fn(),
}));

import { GET, POST } from "../route";
import { getWebhooksForUser } from "@/lib/webhooks-v2";

const mockGetWebhooksForUser = vi.mocked(getWebhooksForUser);

describe("GET /api/webhooks/v2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns webhooks for an authenticated API key", async () => {
    mockGetWebhooksForUser.mockResolvedValue([
      {
        id: "wh-1",
        url: "https://example.com/hook",
        events: ["entity.created"],
        status: "active",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ] as never);

    const req = createMockRequest("/api/webhooks/v2", {
      headers: { "x-api-key": "aaas_testkey123" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(json.webhooks).toHaveLength(1);
    expect(json.webhooks[0].url).toBe("https://example.com/hook");
  });

  it("returns 401 when x-api-key header is missing", async () => {
    const req = createMockRequest("/api/webhooks/v2");
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(401);
    expect(json.error).toContain("x-api-key");
  });

  it("returns 401 when x-api-key header is empty", async () => {
    const req = createMockRequest("/api/webhooks/v2", {
      headers: { "x-api-key": "   " },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(401);
    expect(json.error).toContain("x-api-key");
  });

  it("returns 500 when the data layer throws", async () => {
    mockGetWebhooksForUser.mockRejectedValue(new Error("DB error"));

    const req = createMockRequest("/api/webhooks/v2", {
      headers: { "x-api-key": "aaas_testkey123" },
    });
    const res = await GET(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(json.error).toBe("Internal server error.");
  });
});

describe("POST /api/webhooks/v2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: "wh-new-1" });
  });

  it("creates a webhook with valid input", async () => {
    const req = createMockRequest("/api/webhooks/v2", {
      method: "POST",
      headers: { "x-api-key": "aaas_testkey123" },
      body: {
        url: "https://example.com/webhook",
        events: ["entity.created", "score.changed"],
      },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(201);
    expect(json.id).toBe("wh-new-1");
    expect(json.url).toBe("https://example.com/webhook");
    expect(json.events).toEqual(["entity.created", "score.changed"]);
    expect(json.secret).toBe("whsec_mock_secret_123");
    expect(json.status).toBe("active");
    expect(json.retryPolicy).toBeDefined();
  });

  it("returns 401 when x-api-key is missing", async () => {
    const req = createMockRequest("/api/webhooks/v2", {
      method: "POST",
      body: {
        url: "https://example.com/webhook",
        events: ["entity.created"],
      },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(401);
    expect(json.error).toContain("x-api-key");
  });

  it("returns 400 for invalid JSON body", async () => {
    const fullUrl = new URL("/api/webhooks/v2", "http://localhost:3000");
    const rawReq = new Request(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "aaas_testkey123",
      },
      body: "not json{{{",
    });
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(rawReq);
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toBe("Invalid JSON body.");
  });

  it("returns 400 when url is missing", async () => {
    const req = createMockRequest("/api/webhooks/v2", {
      method: "POST",
      headers: { "x-api-key": "aaas_testkey123" },
      body: { events: ["entity.created"] },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("url");
  });

  it("returns 400 for invalid URL format", async () => {
    const req = createMockRequest("/api/webhooks/v2", {
      method: "POST",
      headers: { "x-api-key": "aaas_testkey123" },
      body: {
        url: "not-a-valid-url",
        events: ["entity.created"],
      },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("Invalid URL");
  });

  it("returns 400 when events array is empty", async () => {
    const req = createMockRequest("/api/webhooks/v2", {
      method: "POST",
      headers: { "x-api-key": "aaas_testkey123" },
      body: {
        url: "https://example.com/webhook",
        events: [],
      },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("events");
  });

  it("returns 400 for invalid event types", async () => {
    const req = createMockRequest("/api/webhooks/v2", {
      method: "POST",
      headers: { "x-api-key": "aaas_testkey123" },
      body: {
        url: "https://example.com/webhook",
        events: ["entity.created", "invalid.event"],
      },
    });
    const res = await POST(req);
    const { status, json } = await parseJsonResponse(res);

    expect(status).toBe(400);
    expect(json.error).toContain("invalid.event");
  });
});
