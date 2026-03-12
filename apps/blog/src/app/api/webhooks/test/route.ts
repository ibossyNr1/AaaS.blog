/**
 * POST /api/webhooks/test
 *
 * Sends a test webhook payload to a given URL so users can verify their
 * endpoint is reachable and correctly validates HMAC signatures.
 *
 * Body: { url: string, secret?: string }
 * Returns: { success: boolean, statusCode?: number, error?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

const TEST_PAYLOAD = {
  event: "webhook.test",
  timestamp: new Date().toISOString(),
  data: {
    entityName: "Test Entity",
    entityType: "tools",
    entitySlug: "test-entity",
    metric: "composite",
    oldValue: 70,
    newValue: 75,
    delta: 5,
    direction: "up",
    test: true,
  },
};

function signPayload(payload: Record<string, unknown>, secret: string): string {
  const body = JSON.stringify(payload);
  return createHmac("sha256", secret).update(body).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const url = body.url as string | undefined;
  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing required field: url" },
      { status: 400 },
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid URL format." },
      { status: 400 },
    );
  }

  const secret = (body.secret as string) ?? "";
  const payload = { ...TEST_PAYLOAD, timestamp: new Date().toISOString() };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (secret) {
    headers["X-Webhook-Signature"] = signPayload(
      payload as unknown as Record<string, unknown>,
      secret,
    );
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      return NextResponse.json(
        { success: true, statusCode: res.status },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        statusCode: res.status,
        error: `Endpoint returned HTTP ${res.status}`,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 200 },
    );
  }
}
