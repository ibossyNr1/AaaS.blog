export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUserNotifications, type NotificationType } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const unreadOnly = searchParams.get("unread") === "true";
    const limitParam = parseInt(searchParams.get("limit") || "30", 10);
    const type = searchParams.get("type") as NotificationType | null;

    const notifications = await getUserNotifications(userId, {
      unreadOnly,
      limit: Math.min(limitParam, 100),
      type: type || undefined,
    });

    return NextResponse.json({
      data: notifications,
      count: notifications.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/notifications/center] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
