import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// GET — List pending categorization suggestions
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty x-api-key header." },
      { status: 401 },
    );
  }

  const statusFilter = req.nextUrl.searchParams.get("status") ?? "pending";

  try {
    let q: FirebaseFirestore.Query = db.collection("categorization_suggestions");

    if (statusFilter !== "all") {
      q = q.where("status", "==", statusFilter);
    }

    const snap = await q
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const suggestions = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
