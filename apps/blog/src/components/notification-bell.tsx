"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@aaas/ui";
import { NotificationCenter } from "./notification-center";

const POLL_INTERVAL = 60_000;

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [centerOpen, setCenterOpen] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/count", {
        headers: { "x-user-id": "current-user" },
      });
      if (!res.ok) return;
      const json = await res.json();
      setUnreadCount(json.count ?? 0);
    } catch {
      // Silently fail -- notifications are non-critical
    }
  }, []);

  // Fetch on mount + poll
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Refetch after center closes
  useEffect(() => {
    if (!centerOpen) fetchCount();
  }, [centerOpen, fetchCount]);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setCenterOpen(!centerOpen)}
          className="relative p-1.5 rounded-md hover:bg-surface transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          aria-expanded={centerOpen}
          aria-haspopup="true"
        >
          <svg
            className="w-5 h-5 text-text-muted"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M10 2a5 5 0 00-5 5v3l-1.5 2.5h13L15 10V7a5 5 0 00-5-5z" />
            <path d="M8 16a2 2 0 004 0" />
          </svg>

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}

          {/* Red dot indicator for any unread */}
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500",
                "animate-pulse pointer-events-none"
              )}
              style={{ display: unreadCount > 0 ? undefined : "none" }}
            />
          )}
        </button>
      </div>

      <NotificationCenter
        open={centerOpen}
        onClose={() => setCenterOpen(false)}
        onCountChange={(count) => setUnreadCount(count)}
      />
    </>
  );
}
