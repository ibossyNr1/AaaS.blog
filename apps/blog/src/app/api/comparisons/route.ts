import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const q = query(
      collection(db, "comparisons"),
      orderBy("interestScore", "desc"),
      limit(20),
    );

    const snap = await getDocs(q);
    const comparisons = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(comparisons, {
      headers: {
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (err) {
    console.error("[api/comparisons] Error fetching comparisons:", err);
    return NextResponse.json(
      { error: "Failed to fetch comparisons" },
      { status: 500 },
    );
  }
}
