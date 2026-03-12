import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

interface Notification {
  id: string;
  type: "score_change" | "agent_failure" | "submission_update";
  title: string;
  detail: string;
  timestamp: string;
  read: false;
  entityType?: string;
  entitySlug?: string;
  link?: string;
}

export async function GET(req: NextRequest) {
  try {
    const watchlistParam = req.nextUrl.searchParams.get("watchlist");
    const watchlistPairs = watchlistParam
      ? watchlistParam.split(",").map((p) => {
          const [type, slug] = p.split(":");
          return { type, slug };
        })
      : [];

    const now = Date.now();
    const sevenDaysAgo = Timestamp.fromMillis(now - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = Timestamp.fromMillis(now - 24 * 60 * 60 * 1000);

    // Fetch trending alerts (last 7 days)
    const trendingQ = query(
      collection(db, "trending_alerts"),
      where("detectedAt", ">=", sevenDaysAgo),
      orderBy("detectedAt", "desc"),
      limit(30),
    );

    // Fetch agent failures (last 24h)
    const agentQ = query(
      collection(db, "agent_logs"),
      where("success", "==", false),
      where("timestamp", ">=", oneDayAgo),
      orderBy("timestamp", "desc"),
      limit(20),
    );

    // Fetch submission updates (last 7 days)
    const submissionQ = query(
      collection(db, "submissions"),
      where("submittedAt", ">=", sevenDaysAgo),
      orderBy("submittedAt", "desc"),
      limit(20),
    );

    const [trendingSnap, agentSnap, submissionSnap] = await Promise.all([
      getDocs(trendingQ),
      getDocs(agentQ),
      getDocs(submissionQ),
    ]);

    const notifications: Notification[] = [];

    // Process trending alerts
    for (const doc of trendingSnap.docs) {
      const d = doc.data();
      const entityType = d.entityType || "";
      const entitySlug = d.entitySlug || "";

      // Filter to watchlist if provided
      if (
        watchlistPairs.length > 0 &&
        !watchlistPairs.some(
          (w) => w.type === entityType && w.slug === entitySlug,
        )
      ) {
        continue;
      }

      const direction = d.direction === "up" ? "+" : "";
      notifications.push({
        id: `trending-${doc.id}`,
        type: "score_change",
        title: `${d.entityName || entitySlug} score ${d.direction || "changed"}`,
        detail: `${d.metric || "Score"} ${direction}${d.delta ?? ""}`,
        timestamp: d.detectedAt?.toDate?.()
          ? d.detectedAt.toDate().toISOString()
          : new Date().toISOString(),
        read: false,
        entityType,
        entitySlug,
        link: entityType && entitySlug ? `/${entityType}/${entitySlug}` : undefined,
      });
    }

    // Process agent failures
    for (const doc of agentSnap.docs) {
      const d = doc.data();
      notifications.push({
        id: `agent-${doc.id}`,
        type: "agent_failure",
        title: `Agent failure: ${d.agent || "unknown"}`,
        detail: `${d.action || "action"} — ${d.details || "no details"}`,
        timestamp: d.timestamp?.toDate?.()
          ? d.timestamp.toDate().toISOString()
          : new Date().toISOString(),
        read: false,
        link: "/dashboard",
      });
    }

    // Process submission updates
    for (const doc of submissionSnap.docs) {
      const d = doc.data();
      notifications.push({
        id: `submission-${doc.id}`,
        type: "submission_update",
        title: `Submission: ${d.name || "untitled"}`,
        detail: `Status: ${d.status || "pending"} (${d.type || "entity"})`,
        timestamp: d.submittedAt?.toDate?.()
          ? d.submittedAt.toDate().toISOString()
          : new Date().toISOString(),
        read: false,
        link: "/me",
      });
    }

    // Sort by timestamp desc, take top 30
    notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const result = notifications.slice(0, 30);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=120",
      },
    });
  } catch (err) {
    console.error("[api/notifications] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
