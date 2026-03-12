export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAvailablePlugins } from "@/lib/plugins";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const plugins = await getAvailablePlugins();
    const plugin = plugins.find((p) => p.id === params.id || p.slug === params.id);

    if (!plugin) {
      return NextResponse.json(
        { error: "Plugin not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: plugin,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch plugin" },
      { status: 500 },
    );
  }
}
