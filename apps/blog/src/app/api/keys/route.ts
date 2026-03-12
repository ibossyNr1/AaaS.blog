import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// POST — Register a new API key
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const name = (body.name as string | undefined)?.trim() ?? "";
    const email = (body.email as string | undefined)?.trim() ?? "";
    const description = (body.description as string | undefined)?.trim() ?? "";

    // Validate name
    if (!name || name.length < 3 || name.length > 50) {
      return NextResponse.json(
        { error: "Name is required and must be between 3 and 50 characters." },
        { status: 400 },
      );
    }

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 },
      );
    }

    // Generate key
    const rawKey = "aaas_" + randomBytes(16).toString("hex");
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.substring(0, 8);

    const now = new Date().toISOString();

    const record = {
      name,
      email,
      description: description || null,
      key: keyHash,
      keyPrefix,
      createdAt: now,
      lastUsedAt: null,
      requestCount: 0,
      rateLimit: 100,
      status: "active" as const,
    };

    const docRef = await db.collection("api_keys").add(record);

    return NextResponse.json(
      {
        id: docRef.id,
        key: rawKey,
        keyPrefix,
        name,
        rateLimit: 100,
        createdAt: now,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET — List keys for an email
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Query parameter 'email' is required and must be a valid email." },
      { status: 400 },
    );
  }

  try {
    const snap = await db
      .collection("api_keys")
      .where("email", "==", email)
      .orderBy("createdAt", "desc")
      .get();

    const keys = snap.docs.map((doc) => ({
      id: doc.id,
      keyPrefix: doc.data().keyPrefix,
      name: doc.data().name,
      status: doc.data().status,
      requestCount: doc.data().requestCount,
      rateLimit: doc.data().rateLimit,
      createdAt: doc.data().createdAt,
      lastUsedAt: doc.data().lastUsedAt,
    }));

    return NextResponse.json({ keys }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
