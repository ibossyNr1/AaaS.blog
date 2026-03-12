import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, deleteDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

const MAX_STORED_ERRORS = 500;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const errorReport = {
      message: String(body.message ?? "Unknown error").slice(0, 2000),
      stack: body.stack ? String(body.stack).slice(0, 4000) : null,
      url: body.url ? String(body.url).slice(0, 500) : null,
      userAgent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      timestamp: new Date().toISOString(),
      digest: body.digest ? String(body.digest).slice(0, 100) : null,
      componentStack: body.componentStack
        ? String(body.componentStack).slice(0, 2000)
        : null,
    };

    const colRef = collection(db, "client_errors");
    await addDoc(colRef, errorReport);

    // Cap the collection — delete oldest entries beyond MAX_STORED_ERRORS
    const countQuery = query(colRef, orderBy("timestamp", "asc"), limit(MAX_STORED_ERRORS + 50));
    const snap = await getDocs(countQuery);

    if (snap.size > MAX_STORED_ERRORS) {
      const toDelete = snap.docs.slice(0, snap.size - MAX_STORED_ERRORS);
      await Promise.all(toDelete.map((d) => deleteDoc(d.ref)));
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[api/errors] Failed to store error report:", err);
    return NextResponse.json(
      { error: "Failed to store error report" },
      { status: 500 },
    );
  }
}
