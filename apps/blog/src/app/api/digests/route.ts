import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const q = query(
      collection(db, "digests"),
      orderBy("weekOf", "desc"),
      limit(12),
    );

    const snap = await getDocs(q);
    const digests = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(digests, {
      headers: {
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (err) {
    console.error("[api/digests] Error fetching digests:", err);
    return NextResponse.json(
      { error: "Failed to fetch digests" },
      { status: 500 },
    );
  }
}
