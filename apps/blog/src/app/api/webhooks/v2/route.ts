export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  VALID_WEBHOOK_EVENTS_V2,
  DEFAULT_RETRY_POLICY,
  generateWebhookSecret,
  getWebhooksForUser,
} from "@/lib/webhooks-v2";
import type { WebhookEventV2, RetryPolicy } from "@/lib/webhooks-v2";

// ---------------------------------------------------------------------------
// GET — List all v2 webhooks for the authenticated user
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty x-api-key header." },
      { status: 401 },
    );
  }

  try {
    const webhooks = await getWebhooksForUser(apiKey);
    return NextResponse.json({ webhooks }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Create a new v2 webhook (auto-generates secret)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty x-api-key header." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  // Validate url
  const url = body.url as string | undefined;
  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Missing required field: url" },
      { status: 400 },
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format." },
      { status: 400 },
    );
  }

  // Validate events
  const events = body.events as unknown;
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json(
      { error: "Missing or empty required field: events (must be a non-empty array)." },
      { status: 400 },
    );
  }

  const invalidEvents = (events as string[]).filter(
    (e) => !VALID_WEBHOOK_EVENTS_V2.includes(e as WebhookEventV2),
  );
  if (invalidEvents.length > 0) {
    return NextResponse.json(
      {
        error: `Invalid event(s): ${invalidEvents.join(", ")}. Allowed: ${VALID_WEBHOOK_EVENTS_V2.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Optional retry policy
  const retryPolicy: RetryPolicy = {
    ...DEFAULT_RETRY_POLICY,
    ...(typeof body.retryPolicy === "object" && body.retryPolicy !== null
      ? (body.retryPolicy as Partial<RetryPolicy>)
      : {}),
  };

  // Generate secret
  const secret = generateWebhookSecret();

  try {
    const webhookData = {
      url,
      events: events as WebhookEventV2[],
      secret,
      status: "active" as const,
      retryPolicy,
      createdAt: new Date().toISOString(),
      createdBy: apiKey,
    };

    const docRef = await addDoc(collection(db, "webhooks_v2"), webhookData);

    return NextResponse.json(
      {
        id: docRef.id,
        url: webhookData.url,
        events: webhookData.events,
        secret, // Returned ONCE at creation time
        status: webhookData.status,
        retryPolicy: webhookData.retryPolicy,
        createdAt: webhookData.createdAt,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
