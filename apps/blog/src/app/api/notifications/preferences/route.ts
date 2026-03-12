export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  try {
    const prefs = await getNotificationPreferences(userId);
    return NextResponse.json({ data: prefs, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[api/notifications/preferences] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await updateNotificationPreferences(userId, body);
    const prefs = await getNotificationPreferences(userId);
    return NextResponse.json({ data: prefs, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[api/notifications/preferences] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
