/**
 * Webhook Dispatch & Delivery Agent
 *
 * Two-phase agent:
 *   1. Dispatch — reads trending_alerts from the last 24 hours, matches them
 *      against active webhook subscriptions, and queues deliveries.
 *   2. Deliver — processes pending items from the webhook_queue collection,
 *      delivers them via HTTP POST, and handles retries with exponential backoff.
 *
 * Run standalone:   npx tsx src/agents/webhook-agent.ts
 * Via runner:       npx tsx src/agents/runner.ts webhook
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createHmac } from "node:crypto";
import { logAgentAction } from "./logger";

// ---------------------------------------------------------------------------
// Firebase Admin init
// ---------------------------------------------------------------------------

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}

const db = getFirestore();

const AGENT_NAME = "webhook";
const MAX_DELIVERIES_PER_RUN = 20;
const MAX_ATTEMPTS = 3;
const MAX_FAIL_COUNT = 5;
const ALERT_WINDOW_HOURS = 24;

// Exponential backoff schedule (in minutes)
const RETRY_DELAYS_MIN = [1, 5, 30];

// Score-change event types that the dispatch phase can produce
const SCORE_EVENTS = [
  "entity.score.up",
  "entity.score.down",
  "entity.score.change",
  "entity.*",
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrendingAlert {
  entityName: string;
  entityType: string;
  entitySlug: string;
  direction: "up" | "down";
  delta: number;
  metric?: string;
  previousScore?: number;
  currentScore?: number;
  detectedAt: string;
}

interface WebhookSubscription {
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  failureCount: number;
  entityTypeFilter?: string;
}

interface QueueItem {
  subscriptionId: string;
  url: string;
  secret: string;
  payload: {
    event: string;
    timestamp: string;
    data: Record<string, unknown>;
  };
  attempts: number;
  retryAfter?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

function signPayload(payload: Record<string, unknown>, secret: string): string {
  const body = JSON.stringify(payload);
  return createHmac("sha256", secret).update(body).digest("hex");
}

// ---------------------------------------------------------------------------
// Phase 1 — Dispatch: trending_alerts -> webhook_queue
// ---------------------------------------------------------------------------

/**
 * Determine which score-change events an alert maps to.
 */
function alertToEvents(direction: "up" | "down"): string[] {
  const events: string[] = ["entity.score.change", "entity.*"];
  if (direction === "up") {
    events.push("entity.score.up");
  } else {
    events.push("entity.score.down");
  }
  return events;
}

/**
 * Check if a webhook is subscribed to any of the given events.
 */
function webhookMatchesEvents(
  webhookEvents: string[],
  alertEvents: string[],
): boolean {
  return webhookEvents.some((we) => alertEvents.includes(we));
}

/**
 * Check if a webhook's optional entityType filter matches the alert.
 */
function webhookMatchesType(
  webhook: WebhookSubscription,
  entityType: string,
): boolean {
  if (!webhook.entityTypeFilter) return true;
  return webhook.entityTypeFilter === entityType;
}

async function dispatchPhase(): Promise<{ queued: number; alertsProcessed: number }> {
  console.log("\n--- Phase 1: Dispatch ---\n");

  // 1. Read trending_alerts from the last 24 hours
  const cutoff = new Date(Date.now() - ALERT_WINDOW_HOURS * 60 * 60 * 1000);
  const cutoffISO = cutoff.toISOString();

  const alertsSnap = await db
    .collection("trending_alerts")
    .where("detectedAt", ">=", cutoffISO)
    .orderBy("detectedAt", "desc")
    .get();

  if (alertsSnap.empty) {
    console.log("No recent trending alerts to dispatch.");
    return { queued: 0, alertsProcessed: 0 };
  }

  console.log(`Found ${alertsSnap.size} trending alerts in the last ${ALERT_WINDOW_HOURS}h.`);

  // 2. Read all active webhooks that subscribe to score events
  const webhooksSnap = await db
    .collection("webhooks")
    .where("active", "==", true)
    .get();

  if (webhooksSnap.empty) {
    console.log("No active webhook subscriptions.");
    return { queued: 0, alertsProcessed: alertsSnap.size };
  }

  // Filter to webhooks that subscribe to at least one score event
  const scoreWebhooks: { id: string; data: WebhookSubscription }[] = [];
  for (const doc of webhooksSnap.docs) {
    const data = doc.data() as WebhookSubscription;
    const hasScoreEvent = data.events.some((e) =>
      (SCORE_EVENTS as readonly string[]).includes(e),
    );
    if (hasScoreEvent) {
      scoreWebhooks.push({ id: doc.id, data });
    }
  }

  if (scoreWebhooks.length === 0) {
    console.log("No webhooks subscribed to score events.");
    return { queued: 0, alertsProcessed: alertsSnap.size };
  }

  console.log(`${scoreWebhooks.length} webhook(s) subscribed to score events.`);

  // 3. Check existing queue to avoid duplicate dispatches (idempotency)
  const existingQueueSnap = await db
    .collection("webhook_queue")
    .where("createdAt", ">=", cutoffISO)
    .get();

  const existingKeys = new Set<string>();
  for (const doc of existingQueueSnap.docs) {
    const item = doc.data() as QueueItem;
    // Key: subscriptionId + event + entity slug from data
    const slug = (item.payload.data?.entitySlug as string) ?? "";
    existingKeys.add(`${item.subscriptionId}:${item.payload.event}:${slug}`);
  }

  // 4. For each alert, match webhooks and queue
  let queued = 0;

  for (const alertDoc of alertsSnap.docs) {
    const alert = alertDoc.data() as TrendingAlert;
    const alertEvents = alertToEvents(alert.direction);
    const eventName = alert.direction === "up"
      ? "entity.score.up"
      : "entity.score.down";

    const payloadData: Record<string, unknown> = {
      entityName: alert.entityName,
      entityType: alert.entityType,
      entitySlug: alert.entitySlug,
      metric: alert.metric ?? "composite",
      oldValue: alert.previousScore ?? 0,
      newValue: alert.currentScore ?? 0,
      delta: alert.delta,
      direction: alert.direction,
    };

    for (const wh of scoreWebhooks) {
      if (!webhookMatchesEvents(wh.data.events, alertEvents)) continue;
      if (!webhookMatchesType(wh.data, alert.entityType)) continue;

      // Idempotency check
      const dedupKey = `${wh.id}:${eventName}:${alert.entitySlug}`;
      if (existingKeys.has(dedupKey)) continue;

      const queueItem: QueueItem = {
        subscriptionId: wh.id,
        url: wh.data.url,
        secret: wh.data.secret,
        payload: {
          event: eventName,
          timestamp: new Date().toISOString(),
          data: payloadData,
        },
        attempts: 0,
        createdAt: new Date().toISOString(),
      };

      await db.collection("webhook_queue").add(queueItem);
      existingKeys.add(dedupKey);
      queued++;

      console.log(`  [QUEUE] ${eventName} ${alert.entitySlug} -> ${wh.data.url}`);
    }
  }

  console.log(`Queued ${queued} new deliveries from ${alertsSnap.size} alerts.`);
  return { queued, alertsProcessed: alertsSnap.size };
}

// ---------------------------------------------------------------------------
// Phase 2 — Deliver: process webhook_queue
// ---------------------------------------------------------------------------

async function deliverWebhook(
  docId: string,
  item: QueueItem,
): Promise<boolean> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (item.secret) {
    headers["X-Webhook-Signature"] = signPayload(
      item.payload as unknown as Record<string, unknown>,
      item.secret,
    );
  }

  try {
    const res = await fetch(item.url, {
      method: "POST",
      headers,
      body: JSON.stringify(item.payload),
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      // Success — update queue entry to "sent" status, reset webhook failCount
      await db.doc(`webhook_queue/${docId}`).update({
        status: "sent",
        lastAttemptAt: new Date().toISOString(),
      });
      await db.doc(`webhooks/${item.subscriptionId}`).update({
        lastTriggeredAt: new Date().toISOString(),
        failCount: 0,
      });

      console.log(`  [OK]   ${item.payload.event} -> ${item.url}`);
      return true;
    }

    console.warn(
      `  [FAIL] ${item.payload.event} -> ${item.url} (HTTP ${res.status})`,
    );
    return false;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`  [FAIL] ${item.payload.event} -> ${item.url} (${message})`);
    return false;
  }
}

async function handleFailure(docId: string, item: QueueItem): Promise<void> {
  const newAttempts = item.attempts + 1;

  if (newAttempts >= MAX_ATTEMPTS) {
    // Max retries exhausted — mark as failed and increment webhook failCount
    await db.doc(`webhook_queue/${docId}`).update({
      status: "failed",
      attempts: newAttempts,
      lastAttemptAt: new Date().toISOString(),
      error: "Max delivery attempts exceeded",
    });

    await db.doc(`webhooks/${item.subscriptionId}`).update({
      failCount: FieldValue.increment(1),
    });

    // Auto-pause broken webhooks
    const webhookDoc = await db.doc(`webhooks/${item.subscriptionId}`).get();
    const webhookData = webhookDoc.data();
    if (webhookData && (webhookData.failCount ?? 0) >= MAX_FAIL_COUNT) {
      await db.doc(`webhooks/${item.subscriptionId}`).update({
        active: false,
        status: "paused",
      });

      console.error(
        `  [PAUSED] Webhook ${item.subscriptionId} auto-paused after ${MAX_FAIL_COUNT}+ failures`,
      );

      await logAgentAction(
        AGENT_NAME,
        "webhook_auto_paused",
        {
          subscriptionId: item.subscriptionId,
          url: item.url,
          failCount: webhookData.failCount,
        },
        false,
        `Webhook auto-paused after ${webhookData.failCount} cumulative failures`,
      );
    }

    console.error(
      `  [DEAD] Queue item ${docId} exhausted after ${MAX_ATTEMPTS} attempts`,
    );

    await logAgentAction(
      AGENT_NAME,
      "delivery_exhausted",
      {
        queueItemId: docId,
        subscriptionId: item.subscriptionId,
        url: item.url,
        event: item.payload.event,
        attempts: newAttempts,
      },
      false,
      `Delivery exhausted after ${MAX_ATTEMPTS} attempts`,
    );

    return;
  }

  // Schedule retry with exponential backoff
  const delayMinutes = RETRY_DELAYS_MIN[newAttempts - 1] ?? 30;
  const retryAfter = new Date(Date.now() + delayMinutes * 60_000).toISOString();

  await db.doc(`webhook_queue/${docId}`).update({
    status: "failed",
    attempts: newAttempts,
    retryAfter,
    lastAttemptAt: new Date().toISOString(),
    error: "Delivery failed, scheduled for retry",
  });

  console.log(
    `  [RETRY] Attempt ${newAttempts}/${MAX_ATTEMPTS} — retry after ${delayMinutes}min`,
  );
}

async function deliveryPhase(): Promise<{ delivered: number; failed: number }> {
  console.log("\n--- Phase 2: Deliver ---\n");

  const now = new Date().toISOString();

  // Fetch pending items and failed items eligible for retry
  const queueSnap = await db
    .collection("webhook_queue")
    .orderBy("createdAt", "asc")
    .limit(MAX_DELIVERIES_PER_RUN * 2)
    .get();

  // Filter to items that are ready to deliver (pending or retry-eligible)
  const readyItems: { id: string; data: QueueItem }[] = [];
  for (const doc of queueSnap.docs) {
    if (readyItems.length >= MAX_DELIVERIES_PER_RUN) break;

    const data = doc.data() as QueueItem & { status?: string };
    const status = data.status ?? "pending";

    // Skip items already sent
    if (status === "sent") continue;

    // Skip failed items that have exhausted attempts
    if (status === "failed" && data.attempts >= MAX_ATTEMPTS) continue;

    // Check retry timing
    if (data.retryAfter && data.retryAfter > now) continue;

    readyItems.push({ id: doc.id, data });
  }

  if (readyItems.length === 0) {
    console.log("No pending webhook deliveries.");
    return { delivered: 0, failed: 0 };
  }

  console.log(`Processing ${readyItems.length} pending deliveries...\n`);

  let delivered = 0;
  let failed = 0;

  for (const { id, data } of readyItems) {
    const success = await deliverWebhook(id, data);

    if (success) {
      delivered++;
    } else {
      failed++;
      await handleFailure(id, data);
    }
  }

  console.log(`\nDelivered: ${delivered} | Failed: ${failed}`);
  return { delivered, failed };
}

// ---------------------------------------------------------------------------
// Main run
// ---------------------------------------------------------------------------

export async function run(): Promise<void> {
  console.log("Webhook Dispatch & Delivery Agent");
  console.log("=================================");

  // Phase 1: Dispatch trending alerts to webhook queue
  const dispatchResult = await dispatchPhase();

  // Phase 2: Deliver queued webhooks
  const deliveryResult = await deliveryPhase();

  // Summary
  const summary = {
    alertsProcessed: dispatchResult.alertsProcessed,
    queued: dispatchResult.queued,
    delivered: deliveryResult.delivered,
    failed: deliveryResult.failed,
  };

  console.log("\n--- Summary ---");
  console.log(`  Alerts processed: ${summary.alertsProcessed}`);
  console.log(`  New deliveries queued: ${summary.queued}`);
  console.log(`  Delivered: ${summary.delivered}`);
  console.log(`  Failed: ${summary.failed}`);

  await logAgentAction(
    AGENT_NAME,
    "run",
    summary,
    deliveryResult.failed === 0,
    deliveryResult.failed > 0 ? `${deliveryResult.failed} delivery failures` : undefined,
  );
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Webhook agent crashed:", err);
      process.exit(1);
    });
}
