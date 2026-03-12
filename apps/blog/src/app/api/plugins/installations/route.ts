export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getInstalledPlugins, installPlugin } from "@/lib/plugins";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json(
      { error: "Missing x-user-id header" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { error: "Missing workspaceId query parameter" },
      { status: 400 },
    );
  }

  try {
    const installations = await getInstalledPlugins(workspaceId);
    return NextResponse.json({
      data: installations,
      count: installations.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch installations" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json(
      { error: "Missing x-user-id header" },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { workspaceId, pluginId, config } = body as {
    workspaceId?: string;
    pluginId?: string;
    config?: Record<string, unknown>;
  };

  if (!workspaceId || !pluginId) {
    return NextResponse.json(
      { error: "workspaceId and pluginId are required" },
      { status: 400 },
    );
  }

  try {
    const installation = await installPlugin(
      workspaceId,
      pluginId,
      config || {},
    );

    return NextResponse.json(
      { data: { ...installation, userId } },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to install plugin";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
