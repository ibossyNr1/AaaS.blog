export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUnreadCount } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  try {
    const count = await getUnreadCount(userId);
    return NextResponse.json({ count, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[api/notifications/count] Error:", err);
    return NextResponse.json(
      { error: "Failed to get unread count" },
      { status: 500 }
    );
  }
}
