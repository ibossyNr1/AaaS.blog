import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagFilter = searchParams.get("tag");

    const snap = await getDocs(collection(db, "entity_clusters"));
    let clusters = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by tag if provided
    if (tagFilter) {
      const tagLower = tagFilter.toLowerCase();
      clusters = clusters.filter((c: Record<string, unknown>) => {
        const tags = (c.centroidTags as string[]) || [];
        return tags.some((t) => t.toLowerCase() === tagLower);
      });
    }

    return NextResponse.json(clusters, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (err) {
    console.error("[api/discover/clusters] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch clusters" },
      { status: 500 },
    );
  }
}
