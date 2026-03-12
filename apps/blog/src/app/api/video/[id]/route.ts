import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

const VALID_STATUSES = ["pending", "rendering", "complete", "published"];

function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey.trim().length === 0) return false;
  // In production, validate against stored keys; for now require non-empty
  return true;
}

// ---------------------------------------------------------------------------
// GET — Return full scene data for a video job
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateApiKey(req)) {
    return NextResponse.json(
      { error: "Missing or invalid x-api-key header." },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const docRef = db.collection("video_queue").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Video job not found." },
        { status: 404 },
      );
    }

    const data = snap.data()!;

    return NextResponse.json(
      {
        id: snap.id,
        template: data.template,
        templateConfig: data.templateConfig,
        entityData: data.entityData,
        scenes: data.scenes,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt || null,
        generatedBy: data.generatedBy,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH — Update video job status
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateApiKey(req)) {
    return NextResponse.json(
      { error: "Missing or invalid x-api-key header." },
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

  const newStatus = body.status as string;
  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const docRef = db.collection("video_queue").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Video job not found." },
        { status: 404 },
      );
    }

    const currentStatus = snap.data()!.status as string;

    // Enforce valid transitions: pending -> rendering -> complete -> published
    const validTransitions: Record<string, string[]> = {
      pending: ["rendering"],
      rendering: ["complete", "pending"], // allow retry by resetting to pending
      complete: ["published"],
      published: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${currentStatus}" to "${newStatus}".` },
        { status: 400 },
      );
    }

    const update: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    // Allow attaching output URL when completing
    if (newStatus === "complete" && body.videoUrl) {
      update.videoUrl = body.videoUrl;
    }

    await docRef.update(update);

    return NextResponse.json(
      { success: true, id, status: newStatus },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
