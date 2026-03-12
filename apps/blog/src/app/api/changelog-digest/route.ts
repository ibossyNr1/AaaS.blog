import { NextRequest, NextResponse } from "next/server";
import {
  collectionGroup,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Change {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: "added" | "modified" | "removed";
}

interface ChangelogDoc {
  changes: Change[];
  timestamp: { toDate?: () => Date; seconds?: number } | string;
}

interface TrendingAlert {
  entityName?: string;
  entityType?: string;
  entitySlug?: string;
  direction?: string;
  delta?: number;
  metric?: string;
  detectedAt?: { toDate?: () => Date; seconds?: number } | string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const COLLECTION_TO_TYPE: Record<string, string> = {
  tools: "tool",
  models: "model",
  agents: "agent",
  skills: "skill",
  scripts: "script",
  benchmarks: "benchmark",
};

function toDate(
  ts: { toDate?: () => Date; seconds?: number } | string | null | undefined,
): Date {
  if (!ts) return new Date();
  if (typeof ts === "string") return new Date(ts);
  if (typeof ts === "object" && "toDate" in ts && typeof ts.toDate === "function")
    return ts.toDate();
  if (typeof ts === "object" && "seconds" in ts && typeof ts.seconds === "number")
    return new Date(ts.seconds * 1000);
  return new Date();
}

/* -------------------------------------------------------------------------- */
/*  GET /api/changelog-digest?period=week|month                                */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") === "month" ? "month" : "week";
    const days = period === "month" ? 30 : 7;

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startTimestamp = Timestamp.fromDate(startDate);

    /* -- Changelog entries ------------------------------------------------- */
    const changelogQuery = query(
      collectionGroup(db, "changelog"),
      where("timestamp", ">=", startTimestamp),
      orderBy("timestamp", "desc"),
    );

    const changelogSnap = await getDocs(changelogQuery);

    const changesByType: Record<string, number> = {};
    const changesByField: Record<string, number> = {};
    const entityChangeCounts: Record<string, { type: string; slug: string; name: string; count: number }> = {};
    let totalChanges = 0;
    const entityKeys = new Set<string>();

    for (const doc of changelogSnap.docs) {
      const data = doc.data() as ChangelogDoc;
      const pathSegments = doc.ref.path.split("/");
      const parentCollection = pathSegments[0] ?? "";
      const entitySlug = pathSegments[1] ?? "";
      const entityType = COLLECTION_TO_TYPE[parentCollection] ?? parentCollection;
      const entityKey = `${entityType}/${entitySlug}`;

      entityKeys.add(entityKey);

      const changeCount = data.changes?.length ?? 0;
      totalChanges += changeCount;

      // Changes by entity type
      changesByType[entityType] = (changesByType[entityType] ?? 0) + changeCount;

      // Changes by field
      for (const change of data.changes ?? []) {
        if (change.field) {
          changesByField[change.field] = (changesByField[change.field] ?? 0) + 1;
        }
      }

      // Per-entity counts
      if (!entityChangeCounts[entityKey]) {
        entityChangeCounts[entityKey] = {
          type: entityType,
          slug: entitySlug,
          name: entitySlug,
          count: 0,
        };
      }
      entityChangeCounts[entityKey].count += changeCount;
    }

    // Top changed entities (up to 10)
    const topChanged = Object.values(entityChangeCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ type, slug, name, count }) => ({
        type,
        slug,
        name,
        changeCount: count,
      }));

    /* -- Trending alerts --------------------------------------------------- */
    const trendingUp: { name: string; type: string; slug: string; delta: number }[] = [];
    const trendingDown: { name: string; type: string; slug: string; delta: number }[] = [];

    try {
      const alertsSnap = await getDocs(collection(db, "trending_alerts"));

      for (const doc of alertsSnap.docs) {
        const data = doc.data() as TrendingAlert;
        const detectedDate = toDate(data.detectedAt);
        if (detectedDate < startDate) continue;

        const entry = {
          name: data.entityName ?? data.entitySlug ?? "Unknown",
          type: data.entityType ?? "unknown",
          slug: data.entitySlug ?? "",
          delta: data.delta ?? 0,
        };

        if (data.direction === "up") {
          trendingUp.push(entry);
        } else if (data.direction === "down") {
          trendingDown.push(entry);
        }
      }
    } catch (err) {
      console.error("[api/changelog-digest] Error fetching trending alerts:", err);
    }

    // Sort by absolute delta descending
    trendingUp.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    trendingDown.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const body = {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      totalChanges,
      entitiesChanged: entityKeys.size,
      changesByType,
      changesByField,
      topChanged,
      trendingUp: trendingUp.slice(0, 10),
      trendingDown: trendingDown.slice(0, 10),
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    });
  } catch (err) {
    console.error("[api/changelog-digest] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate changelog digest" },
      { status: 500 },
    );
  }
}
