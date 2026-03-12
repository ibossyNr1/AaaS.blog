import { NextRequest, NextResponse } from "next/server";
import { assignVariant, trackImpression } from "@/lib/experiments";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET — Assign a variant for a user in an experiment
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const experimentId = req.nextUrl.searchParams.get("experimentId");
  const userId = req.nextUrl.searchParams.get("userId");

  if (!experimentId || !userId) {
    return NextResponse.json(
      { error: "experimentId and userId query parameters are required." },
      { status: 400 },
    );
  }

  try {
    const variant = await assignVariant(userId, experimentId);
    if (!variant) {
      return NextResponse.json(
        { error: "No active experiment found or no variants available." },
        { status: 404 },
      );
    }

    // Track the impression automatically on assignment
    await trackImpression(userId, experimentId, variant.id);

    return NextResponse.json({
      data: {
        experimentId,
        userId,
        variant,
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to assign variant." },
      { status: 500 },
    );
  }
}
