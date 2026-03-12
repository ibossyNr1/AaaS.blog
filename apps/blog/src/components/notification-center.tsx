"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@aaas/ui";
import type { Notification, NotificationType } from "@/lib/notifications";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function notificationIcon(type: NotificationType) {
  switch (type) {
    case "entity_update":
      return (
        <svg className="w-4 h-4 text-circuit shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="2" width="10" height="12" rx="1.5" />
          <path d="M6 6h4M6 9h2" />
        </svg>
      );
    case "score_change":
      return (
        <svg className="w-4 h-4 text-circuit shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 12l4-4 3 3 5-7" />
        </svg>
      );
    case "new_follower":
      return (
        <svg className="w-4 h-4 text-blue-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="5" r="3" />
          <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
        </svg>
      );
    case "mention":
      return (
        <svg className="w-4 h-4 text-yellow-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="3" />
          <path d="M11 8a3 3 0 10-3 3h3" />
          <circle cx="8" cy="8" r="6" />
        </svg>
      );
    case "anomaly":
      return (
        <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2l6 12H2L8 2z" />
          <path d="M8 7v3M8 12h.01" />
        </svg>
      );
    case "workspace_invite":
      return (
        <svg className="w-4 h-4 text-purple-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="4" width="12" height="8" rx="1.5" />
          <path d="M2 4l6 5 6-5" />
        </svg>
      );
    case "achievement":
      return (
        <svg className="w-4 h-4 text-yellow-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 1l2 4 4.5.7-3.3 3.1.8 4.5L8 11.2l-4 2.1.8-4.5L1.5 5.7 6 5z" />
        </svg>
      );
    case "digest_ready":
      return (
        <svg className="w-4 h-4 text-green-400 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="2" width="10" height="12" rx="1.5" />
          <path d="M6 6h4M6 9h4M6 12h2" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 text-text-muted shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v3M8 10h.01" />
        </svg>
      );
  }
}

function priorityColor(priority: Notification["priority"]): string {
  switch (priority) {
    case "urgent":
      return "border-l-red-500";
    case "high":
      return "border-l-yellow-500";
    default:
      return "border-l-transparent";
  }
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabKey = "all" | "unread" | "entity_updates" | "system";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "entity_updates", label: "Entity Updates" },
  { key: "system", label: "System" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export function NotificationCenter({ open, onClose, onCountChange }: NotificationCenterProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");

      if (activeTab === "unread") {
        params.set("unread", "true");
      } else if (activeTab === "entity_updates") {
        params.set("type", "entity_update");
      } else if (activeTab === "system") {
        params.set("type", "system");
      }

      const res = await fetch(`/api/notifications/center?${params.toString()}`, {
        headers: { "x-user-id": "current-user" },
      });
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data ?? []);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetch on open + tab change
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, onClose]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleMarkAllRead() {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onCountChange?.(0);

      await fetch("/api/notifications/center", {
        method: "GET",
        headers: { "x-user-id": "current-user" },
      });
      // Use a simple approach: mark each unread notification
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) =>
          fetch(`/api/notifications/${n.id}`, {
            method: "PUT",
            headers: { "x-user-id": "current-user", "Content-Type": "application/json" },
            body: JSON.stringify({ read: true }),
          })
        )
      );
    } catch {
      // Refetch on error
      fetchNotifications();
    }
  }

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    onCountChange?.(Math.max(0, unreadCount - 1));

    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { "x-user-id": "current-user", "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    } catch {
      fetchNotifications();
    }
  }

  async function handleArchive(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { "x-user-id": "current-user", "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
    } catch {
      fetchNotifications();
    }
  }

  async function handleDelete(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": "current-user" },
      });
    } catch {
      fetchNotifications();
    }
  }

  function handleClick(n: Notification) {
    if (!n.read) handleMarkRead(n.id);
    if (n.link) {
      onClose();
      router.push(n.link);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 z-[61] h-full w-full max-w-md bg-base border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-mono font-semibold text-text uppercase tracking-wider">
            Notifications
          </h2>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-text-muted hover:text-circuit transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                router.push("/notifications");
              }}
              className="text-[11px] text-text-muted hover:text-circuit transition-colors"
            >
              View all
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-surface transition-colors"
              aria-label="Close notifications"
            >
              <svg className="w-4 h-4 text-text-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 px-3 py-2 text-[11px] font-mono uppercase tracking-wider transition-colors",
                activeTab === tab.key
                  ? "text-circuit border-b-2 border-circuit"
                  : "text-text-muted hover:text-text"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-block w-5 h-5 border-2 border-border border-t-circuit rounded-full animate-spin" />
              <p className="text-xs text-text-muted mt-2">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <svg className="w-10 h-10 text-text-muted/30 mx-auto mb-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M10 2a5 5 0 00-5 5v3l-1.5 2.5h13L15 10V7a5 5 0 00-5-5z" />
                <path d="M8 16a2 2 0 004 0" />
              </svg>
              <p className="text-sm text-text-muted">No notifications</p>
              <p className="text-xs text-text-muted/60 mt-1">
                {activeTab === "unread" ? "All caught up!" : "Nothing here yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group flex gap-2.5 px-4 py-3 border-l-2 transition-colors cursor-pointer hover:bg-surface/50",
                    !n.read && "bg-surface/30",
                    priorityColor(n.priority)
                  )}
                  onClick={() => handleClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleClick(n);
                  }}
                >
                  <div className="mt-0.5">{notificationIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs leading-snug",
                        n.read ? "text-text-muted" : "text-text font-medium"
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">
                      {n.body}
                    </p>
                    <p className="text-[10px] text-text-muted/60 font-mono mt-1">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-start gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n.id);
                        }}
                        className="p-1 rounded hover:bg-surface text-text-muted hover:text-circuit transition-colors"
                        title="Mark read"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 8l4 4 6-8" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(n.id);
                      }}
                      className="p-1 rounded hover:bg-surface text-text-muted hover:text-text transition-colors"
                      title="Archive"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="3" width="12" height="3" rx="0.5" />
                        <path d="M3 6v7a1 1 0 001 1h8a1 1 0 001-1V6M6.5 9h3" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n.id);
                      }}
                      className="p-1 rounded hover:bg-surface text-text-muted hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    </button>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-circuit shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
