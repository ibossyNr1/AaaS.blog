import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// DELETE — Revoke an API key
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty x-api-key header." },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const docRef = db.collection("api_keys").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "API key not found." },
        { status: 404 },
      );
    }

    const data = snap.data()!;

    // Verify ownership: hash the provided key and compare
    const providedHash = createHash("sha256").update(apiKey).digest("hex");
    if (data.key !== providedHash) {
      return NextResponse.json(
        { error: "Unauthorized — this key does not own the requested resource." },
        { status: 403 },
      );
    }

    if (data.status === "revoked") {
      return NextResponse.json(
        { error: "This key is already revoked." },
        { status: 400 },
      );
    }

    await docRef.update({ status: "revoked" });

    return NextResponse.json(
      { success: true, message: "API key revoked." },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
