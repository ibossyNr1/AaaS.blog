import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";

const VALID_TYPES = new Set(["tool", "model", "agent", "skill", "script", "benchmark"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string; slug: string } }
) {
  const { type, slug } = params;

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: `Invalid entity type: ${type}` }, { status: 400 });
  }

  try {
    const snapshotsRef = collection(db, "entity_snapshots");
    const q = query(
      snapshotsRef,
      where("entityType", "==", type),
      where("entitySlug", "==", slug),
      orderBy("timestamp", "desc"),
      limit(30)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs
      .map((doc) => {
        const d = doc.data();
        const ts = d.timestamp?.toDate?.() ?? new Date(d.timestamp);
        return {
          date: ts.toISOString().slice(0, 10),
          composite: d.snapshot?.scores?.composite ?? 0,
        };
      })
      .reverse(); // oldest first for chart rendering

    return NextResponse.json(
      { data, count: data.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch sparkline data" }, { status: 500 });
  }
}
