export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getRecentDeliveries } from "@/lib/webhooks-v2";
import type { WebhookEventV2, WebhookDelivery } from "@/lib/webhooks-v2";

// ---------------------------------------------------------------------------
// GET — Recent deliveries with optional filtering
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing x-api-key header." },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50", 10),
      100,
    );
    const event = searchParams.get("event") as WebhookEventV2 | null;
    const status = searchParams.get("status") as WebhookDelivery["status"] | null;

    const deliveries = await getRecentDeliveries(
      limit,
      event ?? undefined,
      status ?? undefined,
    );

    return NextResponse.json({ deliveries }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
