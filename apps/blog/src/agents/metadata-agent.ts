/**
 * Metadata Agent
 *
 * Iterates all entity collections and fetches URL metadata (title, description,
 * favicon, OG image) for each entity with a URL field. Results are stored in
 * the `entity_metadata` collection for rich link previews.
 *
 * Schedule: weekly (supplemental)
 * Idempotent: yes — skips entities checked within the last 7 days
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "metadata";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

/** How long before we re-check a URL (7 days in ms) */
const FRESHNESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Timeout for each fetch request */
const REQUEST_TIMEOUT_MS = 10_000;

interface EntityMetadata {
  type: string;
  slug: string;
  url: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  statusCode: number | null;
  lastChecked: string;
  error?: string;
}

/**
 * Extract a meta tag content value from HTML using regex.
 * Supports both property="" and name="" attribute patterns.
 */
function extractMetaContent(html: string, nameOrProperty: string): string | null {
  // Try property="..." pattern (OpenGraph)
  const propertyPattern = new RegExp(
    `<meta[^>]*property=["']${nameOrProperty}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  let match = html.match(propertyPattern);
  if (match) return match[1];

  // Try content before property
  const reversePropertyPattern = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${nameOrProperty}["']`,
    "i",
  );
  match = html.match(reversePropertyPattern);
  if (match) return match[1];

  // Try name="..." pattern (standard meta)
  const namePattern = new RegExp(
    `<meta[^>]*name=["']${nameOrProperty}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  match = html.match(namePattern);
  if (match) return match[1];

  // Try content before name
  const reverseNamePattern = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${nameOrProperty}["']`,
    "i",
  );
  match = html.match(reverseNamePattern);
  if (match) return match[1];

  return null;
}

/**
 * Extract the page title from <title> tag.
 */
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract the favicon URL from link[rel=icon] or link[rel="shortcut icon"].
 */
function extractFavicon(html: string, baseUrl: string): string | null {
  const iconPattern = /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i;
  let match = html.match(iconPattern);
  if (!match) {
    // Try reverse order (href before rel)
    const reversePattern = /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i;
    match = html.match(reversePattern);
  }

  if (match) {
    const href = match[1];
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  }

  // Fallback to /favicon.ico
  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}/favicon.ico`;
  } catch {
    return null;
  }
}

/**
 * Resolve a potentially relative URL against a base URL.
 */
function resolveUrl(href: string | null, baseUrl: string): string | null {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

/**
 * Fetch a URL and extract metadata from its HTML.
 */
async function fetchMetadata(
  url: string,
  type: string,
  slug: string,
): Promise<EntityMetadata> {
  const result: EntityMetadata = {
    type,
    slug,
    url,
    title: null,
    description: null,
    faviconUrl: null,
    ogImageUrl: null,
    statusCode: null,
    lastChecked: new Date().toISOString(),
  };

  // Validate URL format
  try {
    new URL(url);
  } catch {
    result.error = "invalid_url_format";
    return result;
  }

  if (!url || url === "" || url === "[unverified]") {
    result.error = "empty_or_placeholder";
    return result;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "AaaS-MetadataBot/1.0 (+https://aaas.blog)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeoutId);

    result.statusCode = response.status;

    if (!response.ok) {
      result.error = `http_${response.status}`;
      return result;
    }

    // Only parse HTML content
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      result.error = "not_html";
      return result;
    }

    // Read only the first 50KB to avoid memory issues
    const reader = response.body?.getReader();
    if (!reader) {
      result.error = "no_body";
      return result;
    }

    let html = "";
    const decoder = new TextDecoder();
    const maxBytes = 50 * 1024;
    let bytesRead = 0;

    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      bytesRead += value.length;
    }

    reader.cancel().catch(() => {});

    // Extract metadata
    result.title = extractMetaContent(html, "og:title") || extractTitle(html);
    result.description =
      extractMetaContent(html, "og:description") ||
      extractMetaContent(html, "description");
    result.faviconUrl = extractFavicon(html, url);

    const ogImage = extractMetaContent(html, "og:image");
    result.ogImageUrl = resolveUrl(ogImage, url);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      result.error = "timeout";
    } else {
      result.error = err instanceof Error ? err.message : String(err);
    }
  }

  return result;
}

export async function run(): Promise<void> {
  console.log("Metadata Agent: Starting URL metadata extraction...\n");

  const now = Date.now();
  let totalEntities = 0;
  let fetched = 0;
  let skipped = 0;
  let errors = 0;

  for (const collection of ENTITY_COLLECTIONS) {
    const type = collection.endsWith("s") ? collection.slice(0, -1) : collection;
    console.log(`  Scanning ${collection}...`);

    const snapshot = await db.collection(collection).get();

    for (const entityDoc of snapshot.docs) {
      const data = entityDoc.data();
      const slug = data.slug || entityDoc.id;
      const url = data.url;
      totalEntities++;

      if (!url || url === "" || url === "[unverified]") {
        continue;
      }

      // Check freshness — skip if checked within 7 days
      const metaDocId = `${type}_${slug}`;
      const existingDoc = await db.collection("entity_metadata").doc(metaDocId).get();
      if (existingDoc.exists) {
        const existing = existingDoc.data();
        if (existing?.lastChecked) {
          const lastChecked = new Date(existing.lastChecked).getTime();
          if (now - lastChecked < FRESHNESS_WINDOW_MS) {
            skipped++;
            continue;
          }
        }
      }

      // Fetch and extract metadata
      const metadata = await fetchMetadata(url, type, slug);

      if (metadata.error) {
        errors++;
        console.log(`    [ERROR] ${slug}: ${metadata.error}`);
      } else {
        console.log(`    [OK] ${slug}: "${metadata.title || "(no title)"}"`);
      }

      // Write to Firestore
      await db.collection("entity_metadata").doc(metaDocId).set(metadata, { merge: true });
      fetched++;
    }
  }

  const summary = {
    totalEntities,
    fetched,
    skipped,
    errors,
  };

  console.log(`\n  Summary: ${fetched} fetched, ${skipped} skipped (fresh), ${errors} errors`);

  await logAgentAction(AGENT_NAME, "run_complete", summary, errors === 0);
}
