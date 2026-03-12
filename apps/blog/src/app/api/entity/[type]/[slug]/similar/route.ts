import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EntityType } from "@/lib/types";

const COLLECTION_MAP: Record<EntityType, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string; slug: string } },
) {
  try {
    const { type, slug } = params;

    const collectionName = COLLECTION_MAP[type as EntityType];
    if (!collectionName) {
      return NextResponse.json(
        { error: `Invalid entity type: "${type}"` },
        { status: 400 },
      );
    }

    const docId = `${collectionName}__${slug}`;
    const docRef = doc(db, "entity_similarities", docId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }

    const data = snap.data();
    const similarities = data?.similarities || [];

    return NextResponse.json(similarities, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
