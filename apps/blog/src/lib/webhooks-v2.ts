/**
 * Webhook v2 — Enhanced webhook system with verification + retry
 *
 * Provides HMAC-SHA256 signature verification, exponential backoff retries,
 * and structured delivery tracking via Firestore.
 */

import { createHmac, randomBytes } from "crypto";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  limit as fsLimit,
} from "firebase/firestore";
import { db } from "./firebase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WebhookEventV2 =
  | "entity.created"
  | "entity.updated"
  | "entity.deleted"
  | "score.changed"
  | "trending.detected"
  | "digest.published"
  | "anomaly.detected"
  | "submission.received"
  | "submission.approved";

export const VALID_WEBHOOK_EVENTS_V2: WebhookEventV2[] = [
  "entity.created",
  "entity.updated",
  "entity.deleted",
  "score.changed",
  "trending.detected",
  "digest.published",
  "anomaly.detected",
  "submission.received",
  "submission.approved",
];

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 5,
  backoffMs: 1000,
  backoffMultiplier: 2,
};

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEventV2;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "failed" | "retrying";
  attempts: number;
  responseCode?: number;
  deliveredAt?: string;
  nextRetryAt?: string;
}

export interface WebhookV2 {
  id: string;
  url: string;
  secret: string;
  events: WebhookEventV2[];
  status: "active" | "paused" | "failed";
  retryPolicy: RetryPolicy;
  createdAt: string;
  lastDelivery?: WebhookDelivery;
}

// ---------------------------------------------------------------------------
// Secret generation
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically random webhook secret (64 hex chars).
 */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString("hex")}`;
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 signing & verification
// ---------------------------------------------------------------------------

/**
 * Sign a payload string with HMAC-SHA256. Returns hex digest.
 */
export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify an HMAC-SHA256 signature against a payload and secret.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = signPayload(payload, secret);
  if (expected.length !== signature.length) return false;

  // Timing-safe comparison
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/**
 * Deliver a webhook event to a registered endpoint.
 *
 * Creates a delivery record in Firestore, attempts HTTP POST with
 * HMAC signature header, and updates the delivery status accordingly.
 */
export async function deliverWebhook(
  webhook: WebhookV2,
  event: WebhookEventV2,
  payload: Record<string, unknown>,
): Promise<WebhookDelivery> {
  const deliveryPayload = {
    event,
    timestamp: new Date().toISOString(),
    webhookId: webhook.id,
    data: payload,
  };

  const body = JSON.stringify(deliveryPayload);
  const signature = signPayload(body, webhook.secret);

  // Create pending delivery record
  const deliveryData: Omit<WebhookDelivery, "id"> = {
    webhookId: webhook.id,
    event,
    payload: deliveryPayload,
    status: "pending",
    attempts: 0,
  };

  const deliveryRef = await addDoc(
    collection(db, "webhook_deliveries_v2"),
    deliveryData,
  );

  const deliveryId = deliveryRef.id;

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Id": webhook.id,
        "X-Delivery-Id": deliveryId,
        "X-Webhook-Event": event,
        "User-Agent": "AaaS-Webhooks/2.0",
      },
      body,
      signal: AbortSignal.timeout(30_000),
    });

    const delivery: WebhookDelivery = {
      id: deliveryId,
      ...deliveryData,
      attempts: 1,
      responseCode: response.status,
      status: response.ok ? "delivered" : "retrying",
      deliveredAt: response.ok ? new Date().toISOString() : undefined,
      nextRetryAt: response.ok
        ? undefined
        : computeNextRetry(1, webhook.retryPolicy),
    };

    await updateDoc(doc(db, "webhook_deliveries_v2", deliveryId), {
      attempts: delivery.attempts,
      responseCode: delivery.responseCode,
      status: delivery.status,
      deliveredAt: delivery.deliveredAt ?? null,
      nextRetryAt: delivery.nextRetryAt ?? null,
    });

    return delivery;
  } catch {
    const delivery: WebhookDelivery = {
      id: deliveryId,
      ...deliveryData,
      attempts: 1,
      status: "retrying",
      nextRetryAt: computeNextRetry(1, webhook.retryPolicy),
    };

    await updateDoc(doc(db, "webhook_deliveries_v2", deliveryId), {
      attempts: 1,
      status: "retrying",
      nextRetryAt: delivery.nextRetryAt ?? null,
    });

    return delivery;
  }
}

// ---------------------------------------------------------------------------
// Retry logic
// ---------------------------------------------------------------------------

function computeNextRetry(
  attempt: number,
  policy: RetryPolicy,
): string | undefined {
  if (attempt >= policy.maxRetries) return undefined;

  const delayMs =
    policy.backoffMs * Math.pow(policy.backoffMultiplier, attempt - 1);
  return new Date(Date.now() + delayMs).toISOString();
}

/**
 * Retry all failed/retrying deliveries whose nextRetryAt has passed.
 * Returns the number of deliveries retried.
 */
export async function retryFailedDeliveries(): Promise<number> {
  const now = new Date().toISOString();

  const q = query(
    collection(db, "webhook_deliveries_v2"),
    where("status", "==", "retrying"),
    where("nextRetryAt", "<=", now),
    fsLimit(50),
  );

  const snap = await getDocs(q);
  if (snap.empty) return 0;

  let retried = 0;

  for (const deliveryDoc of snap.docs) {
    const delivery = deliveryDoc.data() as WebhookDelivery;

    // Look up the webhook
    const webhookQ = query(
      collection(db, "webhooks_v2"),
      where("__name__", "==", delivery.webhookId),
    );
    const webhookSnap = await getDocs(webhookQ);

    if (webhookSnap.empty) {
      // Webhook deleted — mark delivery as failed
      await updateDoc(
        doc(db, "webhook_deliveries_v2", deliveryDoc.id),
        { status: "failed" },
      );
      continue;
    }

    const webhook = {
      id: webhookSnap.docs[0].id,
      ...webhookSnap.docs[0].data(),
    } as WebhookV2;

    if (webhook.status !== "active") {
      await updateDoc(
        doc(db, "webhook_deliveries_v2", deliveryDoc.id),
        { status: "failed" },
      );
      continue;
    }

    const body = JSON.stringify(delivery.payload);
    const signature = signPayload(body, webhook.secret);
    const newAttempts = delivery.attempts + 1;

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Id": webhook.id,
          "X-Delivery-Id": deliveryDoc.id,
          "X-Webhook-Event": delivery.event,
          "X-Webhook-Retry": String(newAttempts),
          "User-Agent": "AaaS-Webhooks/2.0",
        },
        body,
        signal: AbortSignal.timeout(30_000),
      });

      const isLastAttempt = newAttempts >= webhook.retryPolicy.maxRetries;

      await updateDoc(
        doc(db, "webhook_deliveries_v2", deliveryDoc.id),
        {
          attempts: newAttempts,
          responseCode: response.status,
          status: response.ok
            ? "delivered"
            : isLastAttempt
              ? "failed"
              : "retrying",
          deliveredAt: response.ok ? new Date().toISOString() : null,
          nextRetryAt:
            response.ok || isLastAttempt
              ? null
              : computeNextRetry(newAttempts, webhook.retryPolicy),
        },
      );
    } catch {
      const isLastAttempt = newAttempts >= webhook.retryPolicy.maxRetries;

      await updateDoc(
        doc(db, "webhook_deliveries_v2", deliveryDoc.id),
        {
          attempts: newAttempts,
          status: isLastAttempt ? "failed" : "retrying",
          nextRetryAt: isLastAttempt
            ? null
            : computeNextRetry(newAttempts, webhook.retryPolicy),
        },
      );
    }

    retried++;
  }

  return retried;
}

// ---------------------------------------------------------------------------
// Helpers — query wrappers for API routes
// ---------------------------------------------------------------------------

export async function getWebhooksForUser(apiKey: string): Promise<WebhookV2[]> {
  const q = query(
    collection(db, "webhooks_v2"),
    where("createdBy", "==", apiKey),
    orderBy("createdAt", "desc"),
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WebhookV2));
}

export async function getDeliveriesForWebhook(
  webhookId: string,
  limit = 20,
): Promise<WebhookDelivery[]> {
  const q = query(
    collection(db, "webhook_deliveries_v2"),
    where("webhookId", "==", webhookId),
    orderBy("attempts", "desc"),
    fsLimit(limit),
  );

  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() } as WebhookDelivery),
  );
}

export async function getRecentDeliveries(
  limit = 50,
  eventFilter?: WebhookEventV2,
  statusFilter?: WebhookDelivery["status"],
): Promise<WebhookDelivery[]> {
  let q = query(
    collection(db, "webhook_deliveries_v2"),
    orderBy("attempts", "desc"),
    fsLimit(limit),
  );

  // Firestore compound queries require indexes — keep it simple
  if (eventFilter) {
    q = query(
      collection(db, "webhook_deliveries_v2"),
      where("event", "==", eventFilter),
      fsLimit(limit),
    );
  }

  if (statusFilter) {
    q = query(
      collection(db, "webhook_deliveries_v2"),
      where("status", "==", statusFilter),
      fsLimit(limit),
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() } as WebhookDelivery),
  );
}
