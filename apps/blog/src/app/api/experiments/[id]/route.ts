import { NextRequest, NextResponse } from "next/server";
import {
  getExperiment,
  getExperimentResults,
  updateExperiment,
  computeConfidence,
} from "@/lib/experiments";
import { validateAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET — Experiment details with aggregated results
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const experiment = await getExperiment(id);
    if (!experiment) {
      return NextResponse.json(
        { error: "Experiment not found." },
        { status: 404 },
      );
    }

    const results = await getExperimentResults(id);

    // Compute pairwise confidence against first variant (control)
    if (results.length >= 2) {
      const control = results[0];
      for (let i = 1; i < results.length; i++) {
        results[i].confidence = computeConfidence(control, results[i]);
      }
    }

    return NextResponse.json({
      data: { experiment, results },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch experiment." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — Update experiment (start, pause, complete)
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await validateAdmin(req.headers);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  const { id } = params;

  try {
    const experiment = await getExperiment(id);
    if (!experiment) {
      return NextResponse.json(
        { error: "Experiment not found." },
        { status: 404 },
      );
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.status) {
      updates.status = body.status;
      if (body.status === "running" && !experiment.startedAt) {
        updates.startedAt = new Date().toISOString();
      }
      if (body.status === "completed") {
        updates.endedAt = new Date().toISOString();
      }
    }
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.variants !== undefined) updates.variants = body.variants;
    if (body.trafficAllocation !== undefined)
      updates.trafficAllocation = body.trafficAllocation;
    if (body.targetAudience !== undefined)
      updates.targetAudience = body.targetAudience;

    await updateExperiment(id, updates);

    const updated = await getExperiment(id);
    return NextResponse.json({
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update experiment." },
      { status: 500 },
    );
  }
}
