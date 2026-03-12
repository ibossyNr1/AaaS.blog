import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// GET — List pending video jobs from the video_queue collection
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const snap = await db
      .collection("video_queue")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const jobs = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        template: data.template,
        entityName:
          data.entityData?.name ||
          data.entityData?.channel ||
          doc.id,
        status: data.status,
        createdAt: data.createdAt,
        sceneCount: Array.isArray(data.scenes) ? data.scenes.length : 0,
      };
    });

    return NextResponse.json(
      { jobs, total: jobs.length },
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
