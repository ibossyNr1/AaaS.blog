import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

interface ActivityItem {
  id: string;
  type: "agent_log" | "trending" | "submission";
  timestamp: string;
  title: string;
  detail: string;
  icon: "agent" | "trending_up" | "trending_down" | "submission" | "approved" | "rejected";
  entityType?: string;
  entitySlug?: string;
  success?: boolean;
}

export async function GET() {
  try {
    const [logsSnap, trendingSnap, submissionsSnap] = await Promise.all([
      getDocs(
        query(collection(db, "agent_logs"), orderBy("timestamp", "desc"), limit(20)),
      ),
      getDocs(
        query(collection(db, "trending_alerts"), orderBy("detectedAt", "desc"), limit(20)),
      ),
      getDocs(
        query(collection(db, "submissions"), orderBy("submittedAt", "desc"), limit(20)),
      ),
    ]);

    const items: ActivityItem[] = [];

    // Normalize agent_logs
    for (const doc of logsSnap.docs) {
      const d = doc.data();
      const ts = d.timestamp?.toDate?.() ?? new Date(d.timestamp);
      items.push({
        id: doc.id,
        type: "agent_log",
        timestamp: ts instanceof Date && !isNaN(ts.getTime()) ? ts.toISOString() : new Date().toISOString(),
        title: `${d.agent ?? "unknown"} — ${d.action ?? "unknown action"}`,
        detail: d.success ? "Completed successfully" : "Failed",
        icon: "agent",
        success: d.success ?? null,
      });
    }

    // Normalize trending_alerts
    for (const doc of trendingSnap.docs) {
      const d = doc.data();
      const ts = d.detectedAt?.toDate?.() ?? new Date(d.detectedAt);
      const delta = d.delta ?? 0;
      const direction = d.direction ?? "up";
      items.push({
        id: doc.id,
        type: "trending",
        timestamp: ts instanceof Date && !isNaN(ts.getTime()) ? ts.toISOString() : new Date().toISOString(),
        title: `${d.entityName ?? "Unknown"} trending ${direction} (${delta > 0 ? "+" : ""}${delta})`,
        detail: `${d.entityType ?? "entity"} — detected by trending agent`,
        icon: direction === "up" ? "trending_up" : "trending_down",
        entityType: d.entityType,
        entitySlug: d.entitySlug,
      });
    }

    // Normalize submissions
    for (const doc of submissionsSnap.docs) {
      const d = doc.data();
      const ts = d.submittedAt?.toDate?.() ?? new Date(d.submittedAt);
      const status = d.status ?? "pending";
      const entityName = d.entity?.name ?? "Unknown entity";
      const entityType = d.entity?.type;
      items.push({
        id: doc.id,
        type: "submission",
        timestamp: ts instanceof Date && !isNaN(ts.getTime()) ? ts.toISOString() : new Date().toISOString(),
        title: status === "pending"
          ? `New submission: ${entityName}`
          : `Submission ${status}: ${entityName}`,
        detail: entityType ? `Type: ${entityType} — Status: ${status}` : `Status: ${status}`,
        icon: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "submission",
        entityType: entityType,
        entitySlug: d.entity?.slug,
      });
    }

    // Sort descending by timestamp, take top 50
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const result = items.slice(0, 50);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (err) {
    console.error("[api/activity] Error fetching activity feed:", err);
    return NextResponse.json(
      { error: "Failed to fetch activity feed" },
      { status: 500 },
    );
  }
}
