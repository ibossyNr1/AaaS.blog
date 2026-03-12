import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EntityType } from "@/lib/types";

const COLLECTION_MAP: Record<EntityType, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

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
  id: string;
  changes: Change[];
  timestamp: { toDate?: () => Date } | string;
  detectedBy?: string;
}

function toDate(ts: ChangelogDoc["timestamp"]): Date {
  if (typeof ts === "string") return new Date(ts);
  if (ts && typeof ts === "object" && "toDate" in ts && typeof ts.toDate === "function") {
    return ts.toDate();
  }
  return new Date();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  try {
    const { type, slug } = await params;

    const collectionName = COLLECTION_MAP[type as EntityType];
    if (!collectionName) {
      return new NextResponse("Invalid entity type", { status: 400 });
    }

    // Look up entity name
    const entityRef = doc(db, collectionName, slug);
    const entitySnap = await getDoc(entityRef);
    const entityName = entitySnap.exists()
      ? (entitySnap.data()?.name as string) ?? slug
      : slug;

    // Fetch changelog entries from subcollection
    const changelogRef = collection(db, collectionName, slug, "changelog");
    const q = query(
      changelogRef,
      orderBy("timestamp", "desc"),
      firestoreLimit(50),
    );
    const snap = await getDocs(q);

    const entries: ChangelogDoc[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ChangelogDoc, "id">),
    }));

    const entityLink = `https://aaas.blog/${type}/${slug}`;
    const feedLink = `https://aaas.blog/api/entity/${type}/${slug}/feed`;
    const lastBuildDate =
      entries.length > 0
        ? toDate(entries[0].timestamp).toUTCString()
        : new Date().toUTCString();

    const items = entries
      .map((entry) => {
        const pubDate = toDate(entry.timestamp).toUTCString();
        const changeCount = entry.changes?.length ?? 0;
        const title = `${changeCount} field${changeCount !== 1 ? "s" : ""} changed`;

        const descriptionLines = (entry.changes ?? []).map((c) => {
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
      <guid isPermaLink="false">${entry.id}</guid>
      <pubDate>${pubDate}</pubDate>
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(entityName)} — Changelog</title>
    <link>${entityLink}</link>
    <description>Change history for ${escapeXml(entityName)} on the AaaS Knowledge Index.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedLink}" rel="self" type="application/rss+xml"/>
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
