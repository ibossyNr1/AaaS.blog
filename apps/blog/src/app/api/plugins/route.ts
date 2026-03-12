export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAvailablePlugins } from "@/lib/plugins";
import type { PluginCategory } from "@/lib/plugins";

const VALID_CATEGORIES: PluginCategory[] = [
  "communication",
  "development",
  "analytics",
  "automation",
  "storage",
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as PluginCategory | null;

    let plugins = await getAvailablePlugins();

    if (category && VALID_CATEGORIES.includes(category)) {
      plugins = plugins.filter((p) => p.category === category);
    }

    return NextResponse.json({
      data: plugins,
      count: plugins.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch plugins" },
      { status: 500 },
    );
  }
}
