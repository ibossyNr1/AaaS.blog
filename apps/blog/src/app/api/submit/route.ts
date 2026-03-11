import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EntityType } from "@/lib/types";

const VALID_TYPES = new Set<EntityType>(["tool", "model", "agent", "skill", "script", "benchmark"]);

const REQUIRED_FIELDS = ["name", "type", "description", "provider", "category"] as const;

export async function POST(req: NextRequest) {
  try {
    // --- Auth ---
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or empty x-api-key header." },
        { status: 401 }
      );
    }

    // --- Parse body ---
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    // --- Validate required fields ---
    const missing = REQUIRED_FIELDS.filter(
      (f) => !body[f] || (typeof body[f] === "string" && (body[f] as string).trim().length === 0)
    );
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // --- Validate entity type ---
    if (!VALID_TYPES.has(body.type as EntityType)) {
      return NextResponse.json(
        {
          error: `Invalid entity type: "${body.type}". Must be one of: ${Array.from(VALID_TYPES).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // --- Store submission ---
    const submission = {
      entity: body,
      status: "pending" as const,
      submittedAt: new Date().toISOString(),
      submittedBy: apiKey, // future: resolve to agent/user identity
    };

    const docRef = await addDoc(collection(db, "submissions"), submission);

    return NextResponse.json(
      {
        id: docRef.id,
        status: "pending",
        message: "Submission received and queued for review.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
