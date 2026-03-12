export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

interface BehaviorEvent {
  action: "view" | "search";
  type?: string;
  slug?: string;
  query?: string;
  timestamp: number;
}

interface BehaviorDocument {
  views: { type: string; slug: string; timestamp: number }[];
  searches: { query: string; timestamp: number }[];
  updatedAt: Timestamp;
}

const MAX_VIEWS = 200;
const MAX_SEARCHES = 100;

/** POST: Persist behavioral events to Firestore for logged-in users. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, events } = body as { uid?: string; events?: BehaviorEvent[] };

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "events array is required" }, { status: 400 });
    }

    // Limit batch size
    if (events.length > 50) {
      return NextResponse.json({ error: "Maximum 50 events per request" }, { status: 400 });
    }

    const docRef = doc(db, "user_behavior", uid);
    const existing = await getDoc(docRef);
    const data: BehaviorDocument = existing.exists()
      ? (existing.data() as BehaviorDocument)
      : { views: [], searches: [], updatedAt: Timestamp.now() };

    for (const event of events) {
      if (event.action === "view" && event.type && event.slug) {
        data.views.unshift({
          type: event.type,
          slug: event.slug,
          timestamp: event.timestamp || Date.now(),
        });
      } else if (event.action === "search" && event.query) {
        data.searches.unshift({
          query: event.query,
          timestamp: event.timestamp || Date.now(),
        });
      }
    }

    // Trim to limits
    data.views = data.views.slice(0, MAX_VIEWS);
    data.searches = data.searches.slice(0, MAX_SEARCHES);
    data.updatedAt = Timestamp.now();

    await setDoc(docRef, data);

    return NextResponse.json({ ok: true, viewCount: data.views.length, searchCount: data.searches.length });
  } catch (err) {
    console.error("[api/user/behavior] POST error:", err);
    return NextResponse.json({ error: "Failed to persist behavior" }, { status: 500 });
  }
}

/** GET: Retrieve behavior summary for cross-device sync. */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "uid query parameter is required" }, { status: 400 });
  }

  try {
    const docRef = doc(db, "user_behavior", uid);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({
        views: [],
        searches: [],
        topTypes: {},
        recentlyViewed: [],
      });
    }

    const data = snap.data() as BehaviorDocument;

    // Compute top types
    const typeCounts: Record<string, number> = {};
    for (const view of data.views) {
      typeCounts[view.type] = (typeCounts[view.type] || 0) + 1;
    }

    // Deduplicated recently viewed
    const seen = new Set<string>();
    const recentlyViewed: { type: string; slug: string }[] = [];
    for (const view of data.views) {
      const key = `${view.type}:${view.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      recentlyViewed.push({ type: view.type, slug: view.slug });
      if (recentlyViewed.length >= 10) break;
    }

    return NextResponse.json({
      views: data.views.slice(0, 50),
      searches: data.searches.slice(0, 20),
      topTypes: typeCounts,
      recentlyViewed,
    });
  } catch (err) {
    console.error("[api/user/behavior] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch behavior" }, { status: 500 });
  }
}
