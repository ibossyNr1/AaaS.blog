import { NextResponse } from "next/server";
import {
  collectionGroup,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatValue(value: unknown, max = 80): string {
  if (value === null || value === undefined) return "null";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (str.length <= max) return str;
  return str.slice(0, max) + "\u2026";
}

interface Change {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: "added" | "modified" | "removed";
}

interface ChangelogDoc {
  changes: Change[];
  timestamp: { toDate?: () => Date } | string;
  detectedBy?: string;
}

/** Map Firestore collection names back to entity type slugs */
const COLLECTION_TO_TYPE: Record<string, string> = {
  tools: "tool",
  models: "model",
  agents: "agent",
  skills: "skill",
  scripts: "script",
  benchmarks: "benchmark",
};

function toDate(ts: ChangelogDoc["timestamp"]): Date {
  if (typeof ts === "string") return new Date(ts);
  if (ts && typeof ts === "object" && "toDate" in ts && typeof ts.toDate === "function") {
    return ts.toDate();
  }
  return new Date();
}

export async function GET() {
  try {
    // collectionGroup("changelog") queries across all entity changelog subcollections
    const q = query(
      collectionGroup(db, "changelog"),
      orderBy("timestamp", "desc"),
      firestoreLimit(100),
    );
    const snap = await getDocs(q);

    const lastBuildDate =
      snap.docs.length > 0
        ? toDate((snap.docs[0].data() as ChangelogDoc).timestamp).toUTCString()
        : new Date().toUTCString();

    const items = snap.docs
      .map((d) => {
        const data = d.data() as ChangelogDoc;
        const pubDate = toDate(data.timestamp).toUTCString();

        // Extract entity type and slug from document path: {collection}/{slug}/changelog/{id}
        const pathSegments = d.ref.path.split("/");
        const parentCollection = pathSegments[0] ?? "";
        const entitySlug = pathSegments[1] ?? "";
        const entityType = COLLECTION_TO_TYPE[parentCollection] ?? parentCollection;

        const changeCount = data.changes?.length ?? 0;
        const title = `${entitySlug} (${entityType}) — ${changeCount} change${changeCount !== 1 ? "s" : ""}`;
        const entityLink = `https://aaas.blog/${entityType}/${entitySlug}`;

        const descriptionLines = (data.changes ?? []).map((c) => {
          const label =
            c.changeType === "added"
              ? "Added"
              : c.changeType === "removed"
                ? "Removed"
                : "Modified";
          if (c.changeType === "added") {
            return `[${label}] ${c.field}: ${formatValue(c.newValue)}`;
          }
          if (c.changeType === "removed") {
            return `[${label}] ${c.field}: ${formatValue(c.oldValue)}`;
          }
          return `[${label}] ${c.field}: ${formatValue(c.oldValue)} -> ${formatValue(c.newValue)}`;
        });

        const description = descriptionLines.join("\n");

        return `    <item>
      <title>${escapeXml(title)}</title>
      <description>${escapeXml(description)}</description>
      <link>${entityLink}</link>
      <guid isPermaLink="false">${d.id}-${pubDate}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(entityType)}</category>
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AaaS Knowledge Index — All Changes</title>
    <link>https://aaas.blog/activity</link>
    <description>Global changelog feed for all entities in the AaaS Knowledge Index.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="https://aaas.blog/api/changes" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    });
  } catch {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
