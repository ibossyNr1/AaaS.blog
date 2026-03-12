import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const AGENTS: Array<{ name: string; label: string; schedule: "daily" | "weekly" }> = [
  { name: "audit", label: "Schema Auditor", schedule: "daily" },
  { name: "heal", label: "Schema Healer", schedule: "daily" },
  { name: "enrich", label: "Enrichment Agent", schedule: "daily" },
  { name: "summary", label: "Summary Agent", schedule: "daily" },
  { name: "changelog", label: "Changelog Agent", schedule: "daily" },
  { name: "freshness", label: "Freshness Agent", schedule: "daily" },
  { name: "rank", label: "Ranking Agent", schedule: "daily" },
  { name: "views", label: "Views Agent", schedule: "daily" },
  { name: "trending", label: "Trending Agent", schedule: "daily" },
  { name: "categorize", label: "Categorization Agent", schedule: "daily" },
  { name: "similarity", label: "Similarity Agent", schedule: "weekly" },
  { name: "validate-links", label: "Link Validator", schedule: "weekly" },
  { name: "media", label: "Media Agent", schedule: "daily" },
  { name: "metadata", label: "Metadata Agent", schedule: "daily" },
  { name: "ingest", label: "Ingestion Agent", schedule: "daily" },
  { name: "auto-review", label: "Auto Review Agent", schedule: "daily" },
  { name: "webhook", label: "Webhook Delivery", schedule: "daily" },
  { name: "digest", label: "Digest Agent", schedule: "daily" },
  { name: "digest-email", label: "Digest Email Agent", schedule: "daily" },
  { name: "comparison", label: "Comparison Agent", schedule: "weekly" },
];

const ENTITY_COLLECTIONS: Record<string, string> = {
  tools: "Tools",
  models: "Models",
  agents: "Agents",
  skills: "Skills",
  scripts: "Scripts",
  benchmarks: "Benchmarks",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toISO(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === "object" && val !== null && "toDate" in val) {
    const d = (val as { toDate: () => Date }).toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : null;
  }
  if (typeof val === "string") {
    const d = new Date(val);
    return !isNaN(d.getTime()) ? d.toISOString() : null;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const cutoff = Timestamp.fromDate(twentyFourHoursAgo);

    // Fetch all recent agent_logs (last 24h) in one query
    const recentLogsSnap = await getDocs(
      query(
        collection(db, "agent_logs"),
        where("timestamp", ">=", cutoff),
        orderBy("timestamp", "desc"),
      ),
    );

    // Build per-agent stats from recent logs
    const agentStats: Record<string, { success: number; failure: number }> = {};
    for (const doc of recentLogsSnap.docs) {
      const d = doc.data();
      const agent = d.agent as string;
      if (!agentStats[agent]) agentStats[agent] = { success: 0, failure: 0 };
      if (d.success) {
        agentStats[agent].success++;
      } else {
        agentStats[agent].failure++;
      }
    }

    // For last run per agent, query most recent log
    const lastRunPromises = AGENTS.map(async (ag) => {
      const snap = await getDocs(
        query(
          collection(db, "agent_logs"),
          where("agent", "==", ag.name),
          orderBy("timestamp", "desc"),
          limit(1),
        ),
      );
      if (snap.empty) {
        return { name: ag.name, lastRun: null, lastStatus: "unknown" as const };
      }
      const d = snap.docs[0].data();
      return {
        name: ag.name,
        lastRun: toISO(d.timestamp),
        lastStatus: d.success ? ("success" as const) : ("failure" as const),
      };
    });

    // Fetch entity counts in parallel
    const entityCountPromises = Object.keys(ENTITY_COLLECTIONS).map(async (col) => {
      const snap = await getDocs(collection(db, col));
      return { collection: col, count: snap.size };
    });

    const [lastRuns, entityResults] = await Promise.all([
      Promise.all(lastRunPromises),
      Promise.all(entityCountPromises),
    ]);

    // Build last-run map
    const lastRunMap: Record<string, { lastRun: string | null; lastStatus: "success" | "failure" | "unknown" }> = {};
    for (const lr of lastRuns) {
      lastRunMap[lr.name] = { lastRun: lr.lastRun, lastStatus: lr.lastStatus };
    }

    // Build agents array
    const agents = AGENTS.map((ag) => ({
      name: ag.name,
      label: ag.label,
      lastRun: lastRunMap[ag.name]?.lastRun ?? null,
      lastStatus: lastRunMap[ag.name]?.lastStatus ?? "unknown",
      runs24h: agentStats[ag.name] ?? { success: 0, failure: 0 },
      schedule: ag.schedule,
    }));

    // Entity counts
    const entityCounts: Record<string, number> = {};
    for (const ec of entityResults) {
      entityCounts[ec.collection] = ec.count;
    }

    // System health: percentage of agents that had at least one successful run in last 24h
    const agentsWithSuccess = agents.filter((a) => a.runs24h.success > 0).length;
    const healthPercentage = agents.length > 0 ? Math.round((agentsWithSuccess / agents.length) * 100) : 0;

    let systemHealth: "healthy" | "degraded" | "down";
    if (healthPercentage >= 80) {
      systemHealth = "healthy";
    } else if (healthPercentage >= 40) {
      systemHealth = "degraded";
    } else {
      systemHealth = "down";
    }

    return NextResponse.json(
      {
        systemHealth,
        healthPercentage,
        agents,
        entityCounts,
        lastUpdated: now.toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=120",
        },
      },
    );
  } catch (err) {
    console.error("[api/status] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch system status" },
      { status: 500 },
    );
  }
}
