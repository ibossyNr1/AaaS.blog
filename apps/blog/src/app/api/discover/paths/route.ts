import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficultyFilter = searchParams.get("difficulty");

    const snap = await getDocs(collection(db, "discovery_paths"));
    let paths = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by difficulty if provided
    if (difficultyFilter) {
      paths = paths.filter(
        (p: Record<string, unknown>) => p.difficulty === difficultyFilter,
      );
    }

    return NextResponse.json(paths, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (err) {
    console.error("[api/discover/paths] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch discovery paths" },
      { status: 500 },
    );
  }
}
