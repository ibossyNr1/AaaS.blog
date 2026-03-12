export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
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

interface FeedItem {
  entityName: string;
  entityType: string;
  entitySlug: string;
  changeSummary: string;
  timestamp: string;
}

export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "public, max-age=60" },
      });
    }

    // Parse "type:slug" ids
    const ids = idsParam.split(",").filter(Boolean);
    const items: FeedItem[] = [];

    // Fetch entity_snapshots for each followed entity
    const fetches = ids.map(async (id) => {
      const [type, slug] = id.split(":");
      if (!type || !slug) return;

      const collectionName = COLLECTION_MAP[type as EntityType];
      if (!collectionName) return;

      const snapshotId = `${collectionName}__${slug}`;
      const snapshotRef = doc(db, "entity_snapshots", snapshotId);

      try {
        const snapshotDoc = await getDoc(snapshotRef);
        if (!snapshotDoc.exists()) return;

        const snapData = snapshotDoc.data();
        const snapshotAt = snapData.snapshotAt ?? null;
        const prevData = snapData.data ?? {};

        // Also fetch current entity for comparison
        const entityRef = doc(db, collectionName, slug);
        const entityDoc = await getDoc(entityRef);
        if (!entityDoc.exists()) return;

        const currentData = entityDoc.data();
        const entityName = currentData.name ?? slug;

        // Build change summary
        const changes: string[] = [];
        if (prevData.version && currentData.version && prevData.version !== currentData.version) {
          changes.push(`Version updated: ${prevData.version} → ${currentData.version}`);
        }
        if (prevData.scores?.composite !== undefined && currentData.scores?.composite !== undefined) {
          const prev = prevData.scores.composite;
          const curr = currentData.scores.composite;
          if (prev !== curr) {
            const delta = curr - prev;
            changes.push(`Composite score: ${prev} → ${curr} (${delta > 0 ? "+" : ""}${delta})`);
          }
        }
        if (prevData.pricingModel !== currentData.pricingModel) {
          changes.push(`Pricing changed to ${currentData.pricingModel}`);
        }

        if (changes.length === 0) {
          changes.push("Entity data refreshed");
        }

        items.push({
          entityName,
          entityType: type,
          entitySlug: slug,
          changeSummary: changes.join("; "),
          timestamp: snapshotAt ?? new Date().toISOString(),
        });
      } catch {
        // skip individual failures
      }
    });

    await Promise.all(fetches);

    // Sort by timestamp descending
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(items, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch (err) {
    console.error("[api/following/feed] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch following feed" },
      { status: 500 },
    );
  }
}
