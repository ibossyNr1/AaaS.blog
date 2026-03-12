import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");
    const severityFilter = searchParams.get("severity");
    const resolvedParam = searchParams.get("resolved");

    // Build query constraints
    const constraints: ReturnType<typeof where>[] = [];

    if (resolvedParam !== null) {
      constraints.push(where("resolved", "==", resolvedParam === "true"));
    } else {
      // Default: show only active (unresolved) anomalies
      constraints.push(where("resolved", "==", false));
    }

    if (typeFilter) {
      constraints.push(where("type", "==", typeFilter));
    }

    if (severityFilter) {
      constraints.push(where("severity", "==", severityFilter));
    }

    const q = query(
      collection(db, "anomalies"),
      ...constraints,
      orderBy("detectedAt", "desc"),
      limit(100),
    );

    const snap = await getDocs(q);

    const anomalies = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by severity (critical first), then by detectedAt desc
    anomalies.sort((a, b) => {
      const sevA = SEVERITY_ORDER[(a as Record<string, unknown>).severity as string] ?? 4;
      const sevB = SEVERITY_ORDER[(b as Record<string, unknown>).severity as string] ?? 4;
      if (sevA !== sevB) return sevA - sevB;
      const tsA = ((a as Record<string, unknown>).detectedAt as string) ?? "";
      const tsB = ((b as Record<string, unknown>).detectedAt as string) ?? "";
      return tsB.localeCompare(tsA);
    });

    return NextResponse.json(anomalies, {
      headers: { "Cache-Control": "no-cache" },
    });
  } catch (err) {
    console.error("[api/analytics/anomalies] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch anomalies" },
      { status: 500, headers: { "Cache-Control": "no-cache" } },
    );
  }
}
