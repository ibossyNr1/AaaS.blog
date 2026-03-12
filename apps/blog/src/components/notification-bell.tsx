"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@aaas/ui";
import { useWatchlist } from "@/lib/use-watchlist";

const STORAGE_KEY = "aaas-notifications-read";
const POLL_INTERVAL = 60_000;

interface Notification {
  id: string;
  type: "score_change" | "agent_failure" | "submission_update";
  title: string;
  detail: string;
  timestamp: string;
  read: boolean;
  entityType?: string;
  entitySlug?: string;
  link?: string;
}

function readReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function typeIcon(type: Notification["type"]) {
  switch (type) {
    case "score_change":
      return (
        <svg className="w-4 h-4 text-circuit shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 12l4-4 3 3 5-7" />
        </svg>
      );
    case "agent_failure":
      return (
        <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <path d="M6 6l4 4M10 6l-4 4" />
        </svg>
      );
    case "submission_update":
      return (
        <svg className="w-4 h-4 text-text-muted shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="2" width="10" height="12" rx="1.5" />
          <path d="M6 6h4M6 9h2" />
        </svg>
      );
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { items: watchlistItems } = useWatchlist();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const watchlistParam = watchlistItems
        .map((w) => `${w.type}:${w.slug}`)
        .join(",");
      const url = watchlistParam
        ? `/api/notifications?watchlist=${encodeURIComponent(watchlistParam)}`
        : "/api/notifications";
      const res = await fetch(url);
      if (!res.ok) return;
      const data: Notification[] = await res.json();
      const stored = readReadIds();
      setReadIds(stored);
      setNotifications(
        data.map((n) => ({ ...n, read: stored.has(n.id) })),
      );
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [watchlistItems]);

  // Fetch on mount + poll
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    const ids = new Set(readIds);
    notifications.forEach((n) => ids.add(n.id));
    writeReadIds(ids);
    setReadIds(ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearAll() {
    setNotifications([]);
    setOpen(false);
  }

  function handleNotificationClick(n: Notification) {
    // Mark as read
    const ids = new Set(readIds);
    ids.add(n.id);
    writeReadIds(ids);
    setReadIds(ids);
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)),
    );
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-md hover:bg-surface transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
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
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] overflow-y-auto z-[55] rounded-lg border border-border bg-base/95 backdrop-blur-xl shadow-lg">
          <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 border-b border-border bg-base/95 backdrop-blur-xl">
            <span className="text-xs font-mono font-semibold text-text uppercase tracking-wider">
              Notifications
            </span>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-text-muted hover:text-circuit transition-colors"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-[11px] text-text-muted hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 flex gap-2.5 items-start hover:bg-surface/50 transition-colors",
                    !n.read && "bg-surface/30",
                  )}
                >
                  <div className="mt-0.5">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs leading-snug truncate",
                        n.read ? "text-text-muted" : "text-text font-medium",
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">
                      {n.detail}
                    </p>
                    <p className="text-[10px] text-text-muted/60 font-mono mt-1">
                      {relativeTime(n.timestamp)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-circuit shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
