/**
 * Link Validator Agent
 *
 * Scans all entities for URL fields (url, apiDocsUrl, implementationGuideUrl)
 * and validates each URL with a HEAD request. Broken links are recorded on
 * the entity document in a `brokenLinks` array field.
 *
 * Schedule: weekly
 * Idempotent: yes — rebuilds brokenLinks from scratch on each run
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "link-validator";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

/** URL fields to check on each entity */
const URL_FIELDS = ["url", "apiDocsUrl", "implementationGuideUrl"];

/** Timeout for each HEAD request in milliseconds */
const REQUEST_TIMEOUT_MS = 10_000;

/** Maximum concurrent requests to avoid overwhelming targets */
const CONCURRENCY_LIMIT = 5;

/**
 * Check if a URL is reachable via HEAD request.
 * Falls back to GET if HEAD returns 405 Method Not Allowed.
 */
async function checkUrl(url: string): Promise<{ reachable: boolean; status: number | null; error?: string }> {
  if (!url || url === "" || url === "[unverified]") {
    return { reachable: false, status: null, error: "empty_or_placeholder" };
  }

  // Basic URL format validation
  try {
    new URL(url);
  } catch {
    return { reachable: false, status: null, error: "invalid_url_format" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "AaaS-LinkValidator/1.0",
      },
    });

    clearTimeout(timeoutId);

    // Retry with GET if HEAD is not allowed
    if (response.status === 405) {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), REQUEST_TIMEOUT_MS);

      response = await fetch(url, {
        method: "GET",
        signal: controller2.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "AaaS-LinkValidator/1.0",
        },
      });

      clearTimeout(timeoutId2);
    }

    const reachable = response.status >= 200 && response.status < 400;
    return { reachable, status: response.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { reachable: false, status: null, error: message };
  }
}

/**
 * Process items in batches to limit concurrency.
 */
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

interface UrlCheckJob {
  collection: string;
  docId: string;
  field: string;
  url: string;
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting link validation...`);

  let totalUrls = 0;
  let brokenCount = 0;
  let validCount = 0;
  let entitiesUpdated = 0;

  try {
    // Collect all URL check jobs
    const jobs: UrlCheckJob[] = [];

    for (const collection of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collection).get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        for (const field of URL_FIELDS) {
          const url = data[field];
          if (url && typeof url === "string" && url !== "") {
            jobs.push({ collection, docId: doc.id, field, url });
          }
        }
      }
    }

    totalUrls = jobs.length;
    console.log(`[${AGENT_NAME}] Found ${totalUrls} URLs to validate.`);

    // Check all URLs with concurrency limiting
    const results = await processInBatches(jobs, CONCURRENCY_LIMIT, async (job) => {
      const result = await checkUrl(job.url);
      const status = result.reachable ? "OK" : "BROKEN";
      console.log(
        `  ${status}: ${job.collection}/${job.docId}.${job.field} -> ${job.url}${result.error ? ` (${result.error})` : result.status ? ` (${result.status})` : ""}`,
      );
      return { ...job, ...result };
    });

    // Group results by entity to build brokenLinks arrays
    const entityBrokenLinks = new Map<string, string[]>();

    for (const result of results) {
      const key = `${result.collection}/${result.docId}`;
      if (!result.reachable) {
        brokenCount++;
        const existing = entityBrokenLinks.get(key) || [];
        existing.push(result.url);
        entityBrokenLinks.set(key, existing);
      } else {
        validCount++;
      }
    }

    // Update entities in Firestore
    // First, clear brokenLinks on all entities that were checked
    const checkedEntities = new Set(
      results.map((r) => `${r.collection}/${r.docId}`),
    );

    for (const entityKey of checkedEntities) {
      const [collection, docId] = entityKey.split("/");
      const brokenLinks = entityBrokenLinks.get(entityKey) || [];
      await db.collection(collection).doc(docId).update({ brokenLinks });
      entitiesUpdated++;
    }

    await logAgentAction(
      AGENT_NAME,
      "validation_complete",
      { totalUrls, validCount, brokenCount, entitiesUpdated },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Validation complete. ${totalUrls} URLs checked: ${validCount} valid, ${brokenCount} broken across ${entitiesUpdated} entities.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "validation_failed",
      { totalUrls, brokenCount },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Validation failed:`, message);
    throw err;
  }
}
