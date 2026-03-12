"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Button, cn } from "@aaas/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Submission {
  id: string;
  entity: Record<string, unknown>;
  status: string;
  submittedAt: string;
  submittedBy: string;
  reviewScore?: number;
  reviewNotes?: string;
}

interface Suggestion {
  id: string;
  entityName: string;
  entityCollection: string;
  entityId: string;
  currentCategory: string;
  suggestedCategory: string;
  currentScore: number;
  suggestedScore: number;
  confidence: number;
  status: string;
  createdAt: string;
}

type Tab = "submissions" | "suggestions";
type SubFilter = "pending" | "approved" | "rejected" | "all";
type SugFilter = "pending" | "applied" | "dismissed" | "all";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const SUB_FILTERS: SubFilter[] = ["pending", "approved", "rejected", "all"];
const SUG_FILTERS: SugFilter[] = ["pending", "applied", "dismissed", "all"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewClient() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [tab, setTab] = useState<Tab>("submissions");

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [subFilter, setSubFilter] = useState<SubFilter>("pending");
  const [subsCount, setSubsCount] = useState(0);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggsLoading, setSuggsLoading] = useState(false);
  const [suggsError, setSuggsError] = useState<string | null>(null);
  const [sugFilter, setSugFilter] = useState<SugFilter>("pending");
  const [suggsCount, setSuggsCount] = useState(0);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-refresh timer
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("aaas-admin-token");
    if (stored && stored.trim().length > 0) {
      setToken(stored);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchSubmissions = useCallback(async () => {
    if (!token) return;
    setSubsLoading(true);
    setSubsError(null);
    try {
      const res = await fetch(`/api/admin/submissions?status=${subFilter}`, {
        headers: { "x-api-key": token },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      const items = data.submissions ?? [];
      setSubmissions(items);
      setSubsCount(items.length);
    } catch (err) {
      setSubsError(err instanceof Error ? err.message : "Failed to fetch submissions");
    } finally {
      setSubsLoading(false);
    }
  }, [token, subFilter]);

  const fetchSuggestions = useCallback(async () => {
    if (!token) return;
    setSuggsLoading(true);
    setSuggsError(null);
    try {
      const res = await fetch(`/api/admin/suggestions?status=${sugFilter}`, {
        headers: { "x-api-key": token },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      const items = data.suggestions ?? [];
      setSuggestions(items);
      setSuggsCount(items.length);
    } catch (err) {
      setSuggsError(err instanceof Error ? err.message : "Failed to fetch suggestions");
    } finally {
      setSuggsLoading(false);
    }
  }, [token, sugFilter]);

  // Load data when token/filter/tab changes
  useEffect(() => {
    if (!token) return;
    if (tab === "submissions") fetchSubmissions();
    else fetchSuggestions();
  }, [token, tab, fetchSubmissions, fetchSuggestions]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!token) return;

    if (refreshRef.current) clearInterval(refreshRef.current);

    refreshRef.current = setInterval(() => {
      if (tab === "submissions") fetchSubmissions();
      else fetchSuggestions();
    }, 30000);

    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [token, tab, fetchSubmissions, fetchSuggestions]);

  // ---------------------------------------------------------------------------
  // Submission actions
  // ---------------------------------------------------------------------------

  async function handleSubmissionAction(id: string, status: "approved" | "rejected", reason?: string) {
    if (!token) return;
    setActionLoading(id);
    try {
      const body: Record<string, string> = { status };
      if (reason) body.reason = reason;

      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": token,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `${res.status} ${res.statusText}`);
      }

      setRejectingId(null);
      setRejectReason("");
      await fetchSubmissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBatchSubmissions(status: "approved" | "rejected") {
    if (!token) return;
    const pending = submissions.filter((s) => s.status === "pending");
    if (pending.length === 0) return;

    const label = status === "approved" ? "approve" : "reject";
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} all ${pending.length} pending submissions?`)) return;

    setBatchLoading(true);
    try {
      for (const sub of pending) {
        const res = await fetch(`/api/admin/submissions/${sub.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": token,
          },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed on ${sub.id}`);
        }
      }
      await fetchSubmissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Batch action failed");
    } finally {
      setBatchLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Suggestion actions
  // ---------------------------------------------------------------------------

  async function handleSuggestionAction(id: string, action: "accept" | "dismiss") {
    if (!token) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/suggestions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": token,
        },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `${res.status} ${res.statusText}`);
      }

      await fetchSuggestions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBatchHighConfidence() {
    if (!token) return;
    const highConf = suggestions.filter(
      (s) => s.status === "pending" && (s.confidence >= 0.8 || s.suggestedScore / Math.max(s.currentScore, 1) >= 1.5),
    );
    if (highConf.length === 0) {
      alert("No high-confidence suggestions to apply.");
      return;
    }
    if (!confirm(`Apply ${highConf.length} high-confidence suggestions?`)) return;

    setBatchLoading(true);
    try {
      for (const sug of highConf) {
        const res = await fetch(`/api/admin/suggestions/${sug.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": token,
          },
          body: JSON.stringify({ action: "accept" }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed on ${sug.id}`);
        }
      }
      await fetchSuggestions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Batch action failed");
    } finally {
      setBatchLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tokenInput.trim().length === 0) return;
    localStorage.setItem("aaas-admin-token", tokenInput.trim());
    setToken(tokenInput.trim());
  }

  function handleLogout() {
    localStorage.removeItem("aaas-admin-token");
    setToken(null);
    setTokenInput("");
    setSubmissions([]);
    setSuggestions([]);
  }

  // ---------------------------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------------------------

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base p-4">
        <Card className="max-w-md w-full">
          <h1 className="text-lg font-mono uppercase tracking-wider text-circuit mb-4">
            Admin Access
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Enter your admin token to access the review queue.
          </p>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Admin token"
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text text-sm font-mono focus:outline-none focus:border-circuit transition-colors"
            />
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Authenticate
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Pending counts for tab badges
  // ---------------------------------------------------------------------------

  const pendingSubCount = subFilter === "pending" ? subsCount : null;
  const pendingSugCount = sugFilter === "pending" ? suggsCount : null;

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-2">
              Admin
            </p>
            <h1 className="text-2xl font-bold text-text">Review Queue</h1>
            <p className="text-xs text-text-muted font-mono mt-1">Auto-refreshes every 30s</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Tabs with count badges */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(["submissions", "suggestions"] as Tab[]).map((t) => {
            const count = t === "submissions" ? pendingSubCount : pendingSugCount;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors border-b-2 -mb-px",
                  tab === t
                    ? "text-circuit border-circuit"
                    : "text-text-muted border-transparent hover:text-text",
                )}
              >
                {t}
                {count !== null && count > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-full bg-circuit/15 text-circuit">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* Submissions Tab                                                    */}
        {/* ================================================================= */}
        {tab === "submissions" && (
          <div className="space-y-4">
            {/* Filter bar + batch actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1">
                {SUB_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSubFilter(f)}
                    className={cn(
                      "px-3 py-1 text-xs font-mono uppercase tracking-wider rounded transition-colors",
                      subFilter === f
                        ? "bg-circuit/15 text-circuit"
                        : "text-text-muted hover:text-text hover:bg-surface",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {subFilter === "pending" && submissions.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={batchLoading}
                    onClick={() => handleBatchSubmissions("approved")}
                    className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white text-xs"
                  >
                    {batchLoading ? "Processing..." : `Approve All (${submissions.length})`}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={batchLoading}
                    onClick={() => handleBatchSubmissions("rejected")}
                    className="text-accent-red text-xs"
                  >
                    Reject All
                  </Button>
                </div>
              )}
            </div>

            {subsLoading && (
              <p className="text-sm text-text-muted font-mono">Loading submissions...</p>
            )}
            {subsError && (
              <p className="text-sm text-accent-red font-mono">{subsError}</p>
            )}
            {!subsLoading && !subsError && submissions.length === 0 && (
              <Card>
                <p className="text-sm text-text-muted">
                  No {subFilter === "all" ? "" : subFilter} submissions.
                </p>
              </Card>
            )}

            {submissions.map((sub) => {
              const entity = sub.entity ?? {};
              const name = (entity.name as string) || "Unnamed";
              const type = (entity.type as string) || "unknown";
              const desc = (entity.description as string) || "";
              const source = sub.submittedBy || "unknown";
              const isRejecting = rejectingId === sub.id;
              const isLoading = actionLoading === sub.id;
              const isExpanded = expandedId === sub.id;
              const isPending = sub.status === "pending";

              return (
                <Card key={sub.id} className="space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                          className="text-base font-semibold text-text truncate hover:text-circuit transition-colors text-left"
                        >
                          <span className="mr-1.5 text-text-muted text-xs">{isExpanded ? "▼" : "▶"}</span>
                          {name}
                        </button>
                        <span className="shrink-0 px-2 py-0.5 text-xs font-mono uppercase tracking-wider text-circuit bg-circuit/10 rounded">
                          {type}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded",
                            sub.status === "pending" && "text-yellow-400 bg-yellow-400/10",
                            sub.status === "approved" && "text-green-400 bg-green-400/10",
                            sub.status === "rejected" && "text-accent-red bg-accent-red/10",
                          )}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted line-clamp-2">{desc}</p>
                    </div>
                    {sub.reviewScore !== undefined && (
                      <span
                        className={cn(
                          "shrink-0 text-xs font-mono px-2 py-1 rounded",
                          sub.reviewScore >= 70
                            ? "text-green-400 bg-green-400/10"
                            : sub.reviewScore >= 40
                              ? "text-yellow-400 bg-yellow-400/10"
                              : "text-accent-red bg-accent-red/10",
                        )}
                      >
                        {sub.reviewScore}/100
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted font-mono">
                    <span>Source: {source}</span>
                    <span>{formatDate(sub.submittedAt)}</span>
                    {sub.reviewNotes && (
                      <span className="text-yellow-400">Note: {sub.reviewNotes}</span>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border pt-3 mt-2">
                      <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                        Full Entity Data
                      </p>
                      <pre className="text-xs font-mono text-text bg-surface rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto border border-border">
                        {JSON.stringify(entity, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Actions — only show for pending */}
                  {isPending && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleSubmissionAction(sub.id, "approved")}
                        className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                      >
                        {isLoading ? "..." : "Approve"}
                      </Button>

                      {!isRejecting ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => {
                            setRejectingId(sub.id);
                            setRejectReason("");
                          }}
                          className="text-accent-red hover:text-accent-red"
                        >
                          Reject
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason (optional)"
                            className="flex-1 px-3 py-1.5 bg-surface border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-accent-red transition-colors"
                          />
                          <Button
                            variant="red"
                            size="sm"
                            disabled={isLoading}
                            onClick={() =>
                              handleSubmissionAction(sub.id, "rejected", rejectReason || undefined)
                            }
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRejectingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* ================================================================= */}
        {/* Suggestions Tab                                                    */}
        {/* ================================================================= */}
        {tab === "suggestions" && (
          <div className="space-y-4">
            {/* Filter bar + batch actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1">
                {SUG_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSugFilter(f)}
                    className={cn(
                      "px-3 py-1 text-xs font-mono uppercase tracking-wider rounded transition-colors",
                      sugFilter === f
                        ? "bg-circuit/15 text-circuit"
                        : "text-text-muted hover:text-text hover:bg-surface",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {sugFilter === "pending" && suggestions.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={batchLoading}
                  onClick={handleBatchHighConfidence}
                  className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white text-xs"
                >
                  {batchLoading ? "Processing..." : "Apply All High Confidence"}
                </Button>
              )}
            </div>

            {suggsLoading && (
              <p className="text-sm text-text-muted font-mono">Loading suggestions...</p>
            )}
            {suggsError && (
              <p className="text-sm text-accent-red font-mono">{suggsError}</p>
            )}
            {!suggsLoading && !suggsError && suggestions.length === 0 && (
              <Card>
                <p className="text-sm text-text-muted">
                  No {sugFilter === "all" ? "" : sugFilter} categorization suggestions.
                </p>
              </Card>
            )}

            {suggestions.map((sug) => {
              const isLoading = actionLoading === sug.id;
              const isPending = sug.status === "pending";
              const confidenceValue = sug.confidence ?? (sug.currentScore > 0 ? sug.suggestedScore / sug.currentScore : 0);
              const isHighConf = confidenceValue >= 0.8 || (sug.currentScore > 0 && sug.suggestedScore / sug.currentScore >= 1.5);

              return (
                <Card key={sug.id} className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-text">
                          {sug.entityName}
                        </h3>
                        <span
                          className={cn(
                            "shrink-0 px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded",
                            sug.status === "pending" && "text-yellow-400 bg-yellow-400/10",
                            (sug.status === "accepted" || sug.status === "applied") && "text-green-400 bg-green-400/10",
                            sug.status === "dismissed" && "text-text-muted bg-surface",
                          )}
                        >
                          {sug.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted font-mono">
                        {sug.entityCollection}/{sug.entityId}
                      </p>
                    </div>
                    {isHighConf && isPending && (
                      <span className="shrink-0 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-green-400 bg-green-400/10 rounded">
                        High Confidence
                      </span>
                    )}
                  </div>

                  {/* Category change */}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-0.5 font-mono text-xs rounded bg-surface border border-border text-text-muted">
                      {sug.currentCategory}
                    </span>
                    <span className="text-text-muted">&rarr;</span>
                    <span className="px-2 py-0.5 font-mono text-xs rounded bg-circuit/10 border border-circuit/20 text-circuit">
                      {sug.suggestedCategory}
                    </span>
                  </div>

                  {/* Confidence */}
                  <div className="flex gap-x-4 text-xs text-text-muted font-mono">
                    <span>Current score: {sug.currentScore}</span>
                    <span>Suggested score: {sug.suggestedScore}</span>
                    <span>
                      Confidence:{" "}
                      {typeof sug.confidence === "number"
                        ? `${(sug.confidence * 100).toFixed(0)}%`
                        : sug.currentScore > 0
                          ? `${(sug.suggestedScore / sug.currentScore).toFixed(1)}x`
                          : "N/A"}
                    </span>
                    {sug.createdAt && <span>{formatDate(sug.createdAt)}</span>}
                  </div>

                  {/* Actions — only show for pending */}
                  {isPending && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleSuggestionAction(sug.id, "accept")}
                        className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                      >
                        {isLoading ? "..." : "Apply"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleSuggestionAction(sug.id, "dismiss")}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
