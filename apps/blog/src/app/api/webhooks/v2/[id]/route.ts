export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  VALID_WEBHOOK_EVENTS_V2,
  getDeliveriesForWebhook,
} from "@/lib/webhooks-v2";
import type { WebhookEventV2 } from "@/lib/webhooks-v2";

// ---------------------------------------------------------------------------
// GET — Webhook details + recent deliveries
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing x-api-key header." }, { status: 401 });
  }

  try {
    const { id } = params;
    const ref = doc(db, "webhooks_v2", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
    }

    const data = snap.data();
    if (data.createdBy !== apiKey) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const deliveries = await getDeliveriesForWebhook(id, 20);

    return NextResponse.json(
      {
        webhook: {
          id: snap.id,
          url: data.url,
          events: data.events,
          status: data.status,
          retryPolicy: data.retryPolicy,
          createdAt: data.createdAt,
          // Never expose secret in GET
        },
        deliveries,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Update webhook
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing x-api-key header." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const { id } = params;
    const ref = doc(db, "webhooks_v2", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
    }

    const data = snap.data();
    if (data.createdBy !== apiKey) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};

    // URL
    if (body.url && typeof body.url === "string") {
      try {
        new URL(body.url);
        updates.url = body.url;
      } catch {
        return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
      }
    }

    // Events
    if (Array.isArray(body.events) && body.events.length > 0) {
      const invalid = (body.events as string[]).filter(
        (e) => !VALID_WEBHOOK_EVENTS_V2.includes(e as WebhookEventV2),
      );
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Invalid event(s): ${invalid.join(", ")}` },
          { status: 400 },
        );
      }
      updates.events = body.events;
    }

    // Status
    if (body.status && ["active", "paused", "failed"].includes(body.status as string)) {
      updates.status = body.status;
    }

    // Retry policy
    if (typeof body.retryPolicy === "object" && body.retryPolicy !== null) {
      updates.retryPolicy = {
        ...data.retryPolicy,
        ...(body.retryPolicy as Record<string, unknown>),
      };
    }

    updates.updatedAt = new Date().toISOString();

    await updateDoc(ref, updates);

    return NextResponse.json(
      { id, ...data, ...updates, secret: undefined },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Remove webhook
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing x-api-key header." }, { status: 401 });
  }

  try {
    const { id } = params;
    const ref = doc(db, "webhooks_v2", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
    }

    const data = snap.data();
    if (data.createdBy !== apiKey) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await deleteDoc(ref);

    return NextResponse.json({ deleted: true, id }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
