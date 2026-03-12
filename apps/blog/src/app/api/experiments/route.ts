import { NextRequest, NextResponse } from "next/server";
import { getAllExperiments, createExperiment } from "@/lib/experiments";
import { validateAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET — List experiments (optionally filter by status)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? "all";

  try {
    const experiments = await getAllExperiments(status);
    return NextResponse.json({
      data: experiments,
      count: experiments.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch experiments." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Create a new experiment (admin only)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const auth = await validateAdmin(req.headers);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  try {
    const body = await req.json();
    const { name, description, variants, trafficAllocation, targetAudience } =
      body;

    if (!name || !variants || !Array.isArray(variants) || variants.length < 2) {
      return NextResponse.json(
        { error: "Name and at least 2 variants are required." },
        { status: 400 },
      );
    }

    const experiment = await createExperiment({
      name,
      description: description ?? "",
      variants,
      trafficAllocation: trafficAllocation ?? 100,
      targetAudience: targetAudience ?? undefined,
    });

    return NextResponse.json({ data: experiment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create experiment." },
      { status: 500 },
    );
  }
}
