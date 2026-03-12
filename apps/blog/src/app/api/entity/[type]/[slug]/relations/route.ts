import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";
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

const VALID_TYPES = new Set<string>(Object.keys(COLLECTION_MAP));

const VALID_RELATION_TYPES = new Set([
  "uses",
  "competes-with",
  "integrates-with",
  "extends",
  "replaces",
  "alternative-to",
  "built-on",
  "inspired-by",
]);

interface ResolvedRelation {
  slug: string;
  name: string;
  type: string;
}

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

    const entityRef = doc(db, collectionName, slug);
    const entitySnap = await getDoc(entityRef);

    if (!entitySnap.exists()) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const entity = entitySnap.data();
    const relations: Record<string, ResolvedRelation[]> = {};

    // Resolve relatedTools, relatedModels, relatedAgents, relatedSkills
    const relatedFields: { field: string; label: string; entityType: EntityType }[] = [
      { field: "relatedTools", label: "tools", entityType: "tool" },
      { field: "relatedModels", label: "models", entityType: "model" },
      { field: "relatedAgents", label: "agents", entityType: "agent" },
      { field: "relatedSkills", label: "skills", entityType: "skill" },
    ];

    for (const { field, label, entityType } of relatedFields) {
      const slugs: string[] = entity[field] || [];
      if (slugs.length === 0) continue;

      const resolved: ResolvedRelation[] = [];
      for (const relSlug of slugs) {
        const relRef = doc(db, COLLECTION_MAP[entityType], relSlug);
        const relSnap = await getDoc(relRef);
        resolved.push({
          slug: relSlug,
          name: relSnap.exists() ? relSnap.data().name : relSlug,
          type: entityType,
        });
      }
      relations[label] = resolved;
    }

    return NextResponse.json(
      { data: relations, timestamp: new Date().toISOString() },
      { headers: { "Cache-Control": "public, max-age=120" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch relations" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  try {
    const { type: sourceType, slug: sourceSlug } = await params;

    if (!VALID_TYPES.has(sourceType)) {
      return NextResponse.json(
        { error: `Invalid source type: "${sourceType}"` },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { relationType, targetType, targetSlug } = body;

    if (!relationType || !targetType || !targetSlug) {
      return NextResponse.json(
        { error: "Missing required fields: relationType, targetType, targetSlug" },
        { status: 400 },
      );
    }

    if (!VALID_RELATION_TYPES.has(relationType)) {
      return NextResponse.json(
        { error: `Invalid relation type: "${relationType}"` },
        { status: 400 },
      );
    }

    if (!VALID_TYPES.has(targetType)) {
      return NextResponse.json(
        { error: `Invalid target type: "${targetType}"` },
        { status: 400 },
      );
    }

    // Check for duplicate pending suggestions
    const existingQuery = query(
      collection(db, "submissions"),
      where("type", "==", "relationship"),
      where("sourceType", "==", sourceType),
      where("sourceSlug", "==", sourceSlug),
      where("relationType", "==", relationType),
      where("targetType", "==", targetType),
      where("targetSlug", "==", targetSlug),
      where("status", "==", "pending"),
    );
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: "This relationship suggestion already exists" },
        { status: 409 },
      );
    }

    const submission = {
      type: "relationship",
      status: "pending",
      sourceType,
      sourceSlug,
      relationType,
      targetType,
      targetSlug,
      submittedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "submissions"), submission);

    return NextResponse.json(
      { id: docRef.id, ...submission },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to submit relationship suggestion" },
      { status: 500 },
    );
  }
}
