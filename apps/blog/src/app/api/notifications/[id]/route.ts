export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { markAsRead, archiveNotification, deleteNotification } from "@/lib/notifications";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await req.json();

    if (body.read === true) {
      await markAsRead(id);
    }

    if (body.archived === true) {
      await archiveNotification(id);
    }

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[api/notifications/[id]] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const { id } = params;

  try {
    await deleteNotification(id);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[api/notifications/[id]] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
