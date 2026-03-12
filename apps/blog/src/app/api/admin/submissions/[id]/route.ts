import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

const COLLECTION_MAP: Record<string, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// PATCH — Approve or reject a submission
// ---------------------------------------------------------------------------

export async function PATCH(
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const status = body.status as string | undefined;
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json(
      { error: 'Invalid status. Must be "approved" or "rejected".' },
      { status: 400 },
    );
  }

  try {
    const docRef = db.collection("submissions").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Submission not found." },
        { status: 404 },
      );
    }

    const submission = docSnap.data()!;
    const now = new Date().toISOString();

    if (status === "approved") {
      const entity = (submission.entity ?? {}) as Record<string, unknown>;
      const name = typeof entity.name === "string" ? entity.name : "";
      const type = typeof entity.type === "string" ? entity.type : "";
      const collection = COLLECTION_MAP[type];

      if (!collection) {
        return NextResponse.json(
          { error: `Invalid entity type: "${type}".` },
          { status: 400 },
        );
      }

      const slug = slugify(name);
      const entityDoc: Record<string, unknown> = {
        ...entity,
        slug,
        addedDate: now,
        lastUpdated: now,
        lastVerified: now,
        addedBy: "admin",
        scores: {
          adoption: 0,
          quality: 0,
          freshness: 100,
          citations: 0,
          engagement: 0,
          composite: 0,
        },
      };

      await db.collection(collection).doc(slug).set(entityDoc);

      await docRef.update({
        status: "approved",
        reviewedBy: "admin",
        reviewedAt: now,
      });

      return NextResponse.json(
        {
          id,
          status: "approved",
          entitySlug: slug,
          entityCollection: collection,
          message: `Submission approved. Entity created at ${collection}/${slug}.`,
        },
        { status: 200 },
      );
    } else {
      const reason =
        typeof body.reason === "string" && body.reason.trim().length > 0
          ? body.reason.trim()
          : undefined;

      const update: Record<string, unknown> = {
        status: "rejected",
        reviewedBy: "admin",
        reviewedAt: now,
      };
      if (reason) {
        update.rejectionReason = reason;
      }

      await docRef.update(update);

      return NextResponse.json(
        {
          id,
          status: "rejected",
          rejectionReason: reason ?? null,
          message: "Submission rejected.",
        },
        { status: 200 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
