"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, cn } from "@aaas/ui";
import type {
  Notification,
  NotificationType,
  NotificationPreferences,
} from "@/lib/notifications";

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

const NOTIFICATION_TYPES: { value: NotificationType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "entity_update", label: "Entity Updates" },
  { value: "score_change", label: "Score Changes" },
  { value: "new_follower", label: "New Followers" },
  { value: "mention", label: "Mentions" },
  { value: "digest_ready", label: "Digests" },
  { value: "anomaly", label: "Anomalies" },
  { value: "workspace_invite", label: "Workspace Invites" },
  { value: "system", label: "System" },
  { value: "achievement", label: "Achievements" },
];

const READ_FILTER: { value: "all" | "unread" | "read"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

function typeIcon(type: NotificationType) {
  const iconMap: Record<NotificationType, { color: string; path: string }> = {
    entity_update: { color: "text-circuit", path: "M3 2h10v12H3zM6 6h4M6 9h2" },
    score_change: { color: "text-circuit", path: "M2 12l4-4 3 3 5-7" },
    new_follower: { color: "text-blue-400", path: "M8 2a3 3 0 100 6 3 3 0 000-6zM3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" },
    mention: { color: "text-yellow-400", path: "M8 5a3 3 0 100 6 3 3 0 000-6zM2 8a6 6 0 1012 0A6 6 0 002 8z" },
    digest_ready: { color: "text-green-400", path: "M3 2h10v12H3zM6 6h4M6 9h4M6 12h2" },
    anomaly: { color: "text-red-400", path: "M8 2l6 12H2L8 2zM8 7v3M8 12h.01" },
    workspace_invite: { color: "text-purple-400", path: "M2 4h12v8H2zM2 4l6 5 6-5" },
    system: { color: "text-text-muted", path: "M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v3M8 10h.01" },
    achievement: { color: "text-yellow-400", path: "M8 1l2 4 4.5.7-3.3 3.1.8 4.5L8 11.2l-4 2.1.8-4.5L1.5 5.7 6 5z" },
  };
  const icon = iconMap[type] || iconMap.system;
  return (
    <svg className={cn("w-4 h-4 shrink-0", icon.color)} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d={icon.path} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationsPageClient() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (readFilter === "unread") params.set("unread", "true");
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/notifications/center?${params}`, {
        headers: { "x-user-id": "current-user" },
      });
      if (!res.ok) return;
      const json = await res.json();
      let data: Notification[] = json.data ?? [];

      // Client-side read filter for "read" since API only supports unread
      if (readFilter === "read") {
        data = data.filter((n) => n.read);
      }

      setNotifications(data);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, [typeFilter, readFilter]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    setPrefsLoading(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        headers: { "x-user-id": "current-user" },
      });
      if (!res.ok) return;
      const json = await res.json();
      setPreferences(json.data);
    } catch {
      // non-critical
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Actions
  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
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
      fetchNotifications();
    }
  }

  async function handleArchiveAllRead() {
    const read = notifications.filter((n) => n.read);
    setNotifications((prev) => prev.filter((n) => !n.read));
    try {
      await Promise.all(
        read.map((n) =>
          fetch(`/api/notifications/${n.id}`, {
            method: "PUT",
            headers: { "x-user-id": "current-user", "Content-Type": "application/json" },
            body: JSON.stringify({ archived: true }),
          })
        )
      );
    } catch {
      fetchNotifications();
    }
  }

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
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
    if (n.link) router.push(n.link);
  }

  async function handleTogglePref(key: keyof NotificationPreferences) {
    if (!preferences) return;
    const val = preferences[key];
    if (typeof val !== "boolean") return;

    const updated = { ...preferences, [key]: !val };
    setPreferences(updated);
    setPrefsSaving(true);
    try {
      await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "x-user-id": "current-user", "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !val }),
      });
    } catch {
      setPreferences(preferences);
    } finally {
      setPrefsSaving(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Notifications</h1>
          <p className="text-sm text-text-muted mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 text-xs font-mono rounded border border-border text-text-muted hover:text-circuit hover:border-circuit transition-colors"
            >
              Mark all read
            </button>
          )}
          {notifications.some((n) => n.read) && (
            <button
              onClick={handleArchiveAllRead}
              className="px-3 py-1.5 text-xs font-mono rounded border border-border text-text-muted hover:text-text hover:border-text transition-colors"
            >
              Archive read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as NotificationType | "all")}
          className="px-3 py-1.5 text-xs font-mono rounded border border-border bg-base text-text appearance-none cursor-pointer"
        >
          {NOTIFICATION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="flex rounded border border-border overflow-hidden">
          {READ_FILTER.map((f) => (
            <button
              key={f.value}
              onClick={() => setReadFilter(f.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-mono transition-colors",
                readFilter === f.value
                  ? "bg-surface text-circuit"
                  : "text-text-muted hover:text-text"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification list */}
      <Card variant="glass" className="divide-y divide-border overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center">
            <div className="inline-block w-5 h-5 border-2 border-border border-t-circuit rounded-full animate-spin" />
            <p className="text-xs text-text-muted mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <svg className="w-12 h-12 text-text-muted/20 mx-auto mb-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M10 2a5 5 0 00-5 5v3l-1.5 2.5h13L15 10V7a5 5 0 00-5-5z" />
              <path d="M8 16a2 2 0 004 0" />
            </svg>
            <p className="text-sm text-text-muted">No notifications found</p>
            <p className="text-xs text-text-muted/60 mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "group flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-surface/50",
                !n.read && "bg-surface/20"
              )}
              onClick={() => handleClick(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleClick(n);
              }}
            >
              <div className="mt-0.5">{typeIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      n.read ? "text-text-muted" : "text-text font-medium"
                    )}
                  >
                    {n.title}
                  </p>
                  {n.priority === "urgent" && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                      urgent
                    </span>
                  )}
                  {n.priority === "high" && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">
                      high
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{n.body}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-text-muted/60 font-mono">
                    {relativeTime(n.createdAt)}
                  </span>
                  <span className="text-[10px] text-text-muted/40 font-mono uppercase">
                    {n.type.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(n.id);
                    }}
                    className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-circuit transition-colors"
                    title="Mark read"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8l4 4 6-8" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchive(n.id);
                  }}
                  className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-text transition-colors"
                  title="Archive"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="3" width="12" height="3" rx="0.5" />
                    <path d="M3 6v7a1 1 0 001 1h8a1 1 0 001-1V6M6.5 9h3" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(n.id);
                  }}
                  className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
              {!n.read && (
                <span className="mt-1.5 w-2 h-2 rounded-full bg-circuit shrink-0" />
              )}
            </div>
          ))
        )}
      </Card>

      {/* Preferences */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Notification Preferences</h2>
        <Card variant="glass" className="p-5 space-y-4">
          {prefsLoading ? (
            <div className="text-center py-4">
              <div className="inline-block w-4 h-4 border-2 border-border border-t-circuit rounded-full animate-spin" />
            </div>
          ) : preferences ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(
                  [
                    { key: "inApp" as const, label: "In-app notifications", desc: "Show notifications in the app" },
                    { key: "email" as const, label: "Email notifications", desc: "Receive email for important updates" },
                    { key: "push" as const, label: "Push notifications", desc: "Browser push notifications" },
                    { key: "digestEmail" as const, label: "Digest emails", desc: "Weekly summary of activity" },
                  ] as const
                ).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start gap-3">
                    <button
                      onClick={() => handleTogglePref(key)}
                      disabled={prefsSaving}
                      className={cn(
                        "mt-0.5 w-8 h-[18px] rounded-full transition-colors relative shrink-0",
                        preferences[key] ? "bg-circuit" : "bg-border"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform",
                          preferences[key] ? "left-[16px]" : "left-[2px]"
                        )}
                      />
                    </button>
                    <div>
                      <p className="text-sm text-text font-medium">{label}</p>
                      <p className="text-xs text-text-muted">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">
                  Quiet Hours
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={preferences.quietHoursStart || ""}
                    onChange={async (e) => {
                      const val = e.target.value || undefined;
                      setPreferences({ ...preferences, quietHoursStart: val });
                      await fetch("/api/notifications/preferences", {
                        method: "PUT",
                        headers: { "x-user-id": "current-user", "Content-Type": "application/json" },
                        body: JSON.stringify({ quietHoursStart: val }),
                      });
                    }}
                    className="px-2 py-1 text-xs font-mono rounded border border-border bg-base text-text"
                  />
                  <span className="text-xs text-text-muted">to</span>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd || ""}
                    onChange={async (e) => {
                      const val = e.target.value || undefined;
                      setPreferences({ ...preferences, quietHoursEnd: val });
                      await fetch("/api/notifications/preferences", {
                        method: "PUT",
                        headers: { "x-user-id": "current-user", "Content-Type": "application/json" },
                        body: JSON.stringify({ quietHoursEnd: val }),
                      });
                    }}
                    className="px-2 py-1 text-xs font-mono rounded border border-border bg-base text-text"
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-text-muted">Failed to load preferences</p>
          )}
        </Card>
      </div>
    </div>
  );
}
