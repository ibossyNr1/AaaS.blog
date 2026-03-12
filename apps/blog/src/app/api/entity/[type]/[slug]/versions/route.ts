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
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  try {
    const { type, slug } = await params;

    const collectionName = COLLECTION_MAP[type as EntityType];
    if (!collectionName) {
      return NextResponse.json(
        { error: `Invalid entity type: "${type}"` },
        { status: 400 },
      );
    }

    const versions: {
      label: string;
      timestamp: string;
      data: Record<string, unknown>;
    }[] = [];

    // Read the entity_snapshots document (previous version)
    const snapshotId = `${collectionName}__${slug}`;
    const snapshotRef = doc(db, "entity_snapshots", snapshotId);
    const snapshotDoc = await getDoc(snapshotRef);

    if (snapshotDoc.exists()) {
      const snapData = snapshotDoc.data();
      versions.push({
        label: "snapshot",
        timestamp: snapData.snapshotAt ?? new Date().toISOString(),
        data: snapData.data ?? {},
      });
    }

    // Read the current entity (latest version)
    const entityRef = doc(db, collectionName, slug);
    const entityDoc = await getDoc(entityRef);

    if (entityDoc.exists()) {
      versions.push({
        label: "current",
        timestamp: new Date().toISOString(),
        data: entityDoc.data() as Record<string, unknown>,
      });
    }

    return NextResponse.json(versions, {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
