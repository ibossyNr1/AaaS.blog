import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ref = doc(db, "topic_maps", "latest");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json(
        { topics: [], connections: [] },
        { headers: { "Cache-Control": "public, max-age=300" } },
      );
    }

    return NextResponse.json(snap.data(), {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (err) {
    console.error("[api/discover/topics] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch topic map" },
      { status: 500 },
    );
  }
}
