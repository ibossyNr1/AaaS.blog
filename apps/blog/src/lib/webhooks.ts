/**
 * Webhook Types & Dispatcher
 *
 * Defines webhook event types, subscription model, and dispatch logic.
 * Subscriptions are stored in the Firestore `webhooks` collection.
 * Dispatched deliveries are queued in the `webhook_queue` collection.
 */

import { createHmac } from "crypto";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "./firebase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WebhookEvent =
  | "new_entity"
  | "entity_updated"
  | "new_episode"
  | "agent_alert"
  | "agent_run_complete"
  | "entity.score.up"
  | "entity.score.down"
  | "entity.score.change"
  | "entity.*";

export const VALID_WEBHOOK_EVENTS: WebhookEvent[] = [
  "new_entity",
  "entity_updated",
  "new_episode",
  "agent_alert",
  "agent_run_complete",
  "entity.score.up",
  "entity.score.down",
  "entity.score.change",
  "entity.*",
];

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string; // HMAC signing key
  active: boolean;
  createdAt: string;
  lastDelivery?: string;
  failureCount: number;
}

export interface WebhookQueueItem {
  id?: string;
  subscriptionId: string;
  url: string;
  secret: string;
  payload: WebhookPayload;
  attempts: number;
  retryAfter?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// HMAC Signing
// ---------------------------------------------------------------------------

/**
 * Create an HMAC-SHA256 hex signature for a webhook payload.
 */
export function signPayload(payload: WebhookPayload, secret: string): string {
  const body = JSON.stringify(payload);
  return createHmac("sha256", secret).update(body).digest("hex");
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/**
 * Dispatch a webhook event.
 *
 * Reads all active subscriptions that listen for the given event and writes
 * a delivery record into the `webhook_queue` collection for each match.
 */
export async function dispatchWebhook(
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<number> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Find active subscriptions that include this event
  const subsQuery = query(
    collection(db, "webhooks"),
    where("active", "==", true),
    where("events", "array-contains", event),
  );

  const snap = await getDocs(subsQuery);

  if (snap.empty) {
    return 0;
  }

  let queued = 0;

  for (const doc of snap.docs) {
    const sub = doc.data() as Omit<WebhookSubscription, "id">;

    const queueItem: Omit<WebhookQueueItem, "id"> = {
      subscriptionId: doc.id,
      url: sub.url,
      secret: sub.secret,
      payload,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, "webhook_queue"), queueItem);
    queued++;
  }

  return queued;
}
