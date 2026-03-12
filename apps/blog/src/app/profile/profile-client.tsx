"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, cn } from "@aaas/ui";
import { useWatchlist } from "@/lib/use-watchlist";

interface Activity {
  id: string;
  kind: "submission" | "comment";
  timestamp: string;
  title: string;
  entityType?: string;
  entitySlug?: string;
  status?: string;
}

interface ProfileData {
  submissions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  comments: {
    total: number;
    upvotesReceived: number;
  };
  recentActivity: Activity[];
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function ProfileClient() {
  const [author, setAuthor] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items: watchlistItems } = useWatchlist();

  // Read author from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("aaas-author");
    if (stored) setAuthor(stored);
  }, []);

  const fetchProfile = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile?author=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error("Failed to load profile");
      const data: ProfileData = await res.json();
      setProfile(data);
    } catch {
      setError("Could not load profile data. Try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch profile when author changes
  useEffect(() => {
    if (author) fetchProfile(author);
  }, [author, fetchProfile]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!author) return;
    const interval = setInterval(() => fetchProfile(author), 60_000);
    return () => clearInterval(interval);
  }, [author, fetchProfile]);

  const handleSetProfile = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    localStorage.setItem("aaas-author", trimmed);
    setAuthor(trimmed);
    setNameInput("");
  };

  const handleChangeName = () => {
    setAuthor(null);
    setProfile(null);
  };

  // No author set — show setup form
  if (!author) {
    return (
      <section className="min-h-screen bg-base pt-24 pb-16 px-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-semibold text-text mb-2">Set Up Your Profile</h1>
          <p className="text-text-muted text-sm mb-6">
            Enter your author name to view your contribution profile.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetProfile()}
              placeholder="Your name or handle"
              className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-circuit"
            />
            <button
              onClick={handleSetProfile}
              className="px-4 py-2 rounded-lg bg-circuit text-base text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Set Profile
            </button>
          </div>
        </div>
      </section>
    );
  }

  const oldestDate = profile?.recentActivity.length
    ? new Date(profile.recentActivity[profile.recentActivity.length - 1].timestamp).toLocaleDateString()
    : null;

  return (
    <section className="min-h-screen bg-base pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-circuit/20 border border-circuit/40 flex items-center justify-center text-circuit text-xl font-bold uppercase">
            {author.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-text">{author}</h1>
            <p className="text-text-muted text-sm">
              {oldestDate ? `Member since ${oldestDate}` : "New contributor"}
            </p>
          </div>
          <button
            onClick={handleChangeName}
            className="px-3 py-1.5 rounded-lg border border-border text-text-muted text-xs hover:text-text hover:border-circuit/40 transition-colors"
          >
            Change Name
          </button>
        </div>

        {loading && !profile && (
          <div className="text-text-muted text-sm font-mono animate-pulse">Loading profile...</div>
        )}

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-3 border border-red-400/20">
            {error}
          </div>
        )}

        {profile && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-surface border-border">
                <p className="text-2xl font-bold text-text">{profile.submissions.total}</p>
                <p className="text-xs text-text-muted mt-1">Submissions</p>
                <div className="flex gap-2 mt-2 text-xs font-mono">
                  <span className="text-yellow-400">{profile.submissions.pending} pending</span>
                  <span className="text-green-400">{profile.submissions.approved} approved</span>
                  <span className="text-red-400">{profile.submissions.rejected} rejected</span>
                </div>
              </Card>

              <Card className="p-4 bg-surface border-border">
                <p className="text-2xl font-bold text-text">{profile.comments.total}</p>
                <p className="text-xs text-text-muted mt-1">Comments</p>
              </Card>

              <Card className="p-4 bg-surface border-border">
                <p className="text-2xl font-bold text-text">{profile.comments.upvotesReceived}</p>
                <p className="text-xs text-text-muted mt-1">Upvotes Received</p>
              </Card>

              <Card className="p-4 bg-surface border-border">
                <p className="text-2xl font-bold text-text">{watchlistItems.length}</p>
                <p className="text-xs text-text-muted mt-1">Watchlist Items</p>
              </Card>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-lg font-semibold text-text mb-4">Recent Activity</h2>
              {profile.recentActivity.length === 0 ? (
                <p className="text-text-muted text-sm">No activity yet. Start by submitting an entity or leaving a comment.</p>
              ) : (
                <div className="space-y-1">
                  {profile.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 py-3 px-4 rounded-lg hover:bg-surface/60 transition-colors"
                    >
                      <div
                        className={cn(
                          "mt-1 w-2 h-2 rounded-full shrink-0",
                          item.kind === "submission"
                            ? item.status === "approved"
                              ? "bg-green-400"
                              : item.status === "rejected"
                                ? "bg-red-400"
                                : "bg-yellow-400"
                            : "bg-circuit",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-text-muted uppercase">
                            {item.kind}
                          </span>
                          {item.status && (
                            <span className="text-xs font-mono text-text-muted">
                              ({item.status})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text truncate">{item.title}</p>
                        {item.entityType && item.entitySlug && (
                          <Link
                            href={`/${item.entityType}/${item.entitySlug}`}
                            className="text-xs text-circuit hover:underline"
                          >
                            {item.entityType}/{item.entitySlug}
                          </Link>
                        )}
                      </div>
                      <span className="text-xs text-text-muted shrink-0 font-mono">
                        {relativeTime(item.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Watchlist Section */}
            <div>
              <h2 className="text-lg font-semibold text-text mb-4">Watchlist</h2>
              {watchlistItems.length === 0 ? (
                <p className="text-text-muted text-sm">
                  No items in your watchlist.{" "}
                  <Link href="/explore" className="text-circuit hover:underline">
                    Explore entities
                  </Link>{" "}
                  to start watching.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {watchlistItems.map((item) => (
                    <Link
                      key={`${item.type}-${item.slug}`}
                      href={`/${item.type}/${item.slug}`}
                    >
                      <Card className="p-4 bg-surface border-border hover:border-circuit/40 transition-colors">
                        <p className="text-sm font-medium text-text truncate">{item.name}</p>
                        <p className="text-xs font-mono text-text-muted mt-1">{item.type}/{item.slug}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
