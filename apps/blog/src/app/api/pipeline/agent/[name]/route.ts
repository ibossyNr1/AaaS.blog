import { NextRequest, NextResponse } from "next/server";
import { getAgentExecutionHistory } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } },
) {
  const { name } = params;
  const { searchParams } = req.nextUrl;
  const days = Math.min(Math.max(Number(searchParams.get("days") || 7), 1), 90);

  try {
    const history = await getAgentExecutionHistory(name, days);
    return NextResponse.json({ agent: name, days, data: history });
  } catch (err) {
    console.error(`[api/pipeline/agent/${name}]`, err);
    return NextResponse.json(
      { error: `Failed to fetch history for agent "${name}"` },
      { status: 500 },
    );
  }
}
