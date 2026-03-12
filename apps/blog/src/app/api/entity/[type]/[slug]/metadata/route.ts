import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EntityType } from "@/lib/types";

const VALID_TYPES: EntityType[] = ["tool", "model", "agent", "skill", "script", "benchmark"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string; slug: string } },
) {
  try {
    const { type, slug } = params;

    if (!VALID_TYPES.includes(type as EntityType)) {
      return NextResponse.json(
        { error: `Invalid entity type: "${type}"` },
        { status: 400 },
      );
    }

    const docId = `${type}_${slug}`;
    const docRef = doc(db, "entity_metadata", docId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json(
        { error: "No metadata found for this entity." },
        { status: 404 },
      );
    }

    return NextResponse.json(snap.data(), {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
