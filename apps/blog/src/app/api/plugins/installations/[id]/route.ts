export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updatePluginConfig, uninstallPlugin } from "@/lib/plugins";
import type { PluginInstallation } from "@/lib/plugins";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const snap = await getDoc(doc(db, "plugin_installations", params.id));

    if (!snap.exists()) {
      return NextResponse.json(
        { error: "Installation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: { id: snap.id, ...snap.data() } as PluginInstallation,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch installation" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

  try {
    // Only allow updating config and status
    const update: Record<string, unknown> = {};
    if (body.config !== undefined) update.config = body.config;
    if (body.status !== undefined) update.status = body.status;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update (config, status)" },
        { status: 400 },
      );
    }

    await updatePluginConfig(params.id, update);

    return NextResponse.json({
      message: "Installation updated",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update installation" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json(
      { error: "Missing x-user-id header" },
      { status: 401 },
    );
  }

  try {
    await uninstallPlugin(params.id);
    return NextResponse.json({
      message: "Plugin uninstalled",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to uninstall plugin" },
      { status: 500 },
    );
  }
}
