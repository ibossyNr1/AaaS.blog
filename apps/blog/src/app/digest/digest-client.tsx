"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, cn } from "@aaas/ui";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DigestEntity {
  name: string;
  type: string;
  slug: string;
  provider?: string;
}

interface DigestMover {
  name: string;
  type: string;
  slug: string;
  direction: string;
  delta: number;
  metric: string;
}

interface WeeklyDigest {
  id: string;
  weekOf: string;
  weekEnd: string;
  newEntities: DigestEntity[];
  topMovers: DigestMover[];
  approvedSubmissions: number;
  agentRuns: { total: number; successful: number; failed: number };
  highlights: string[];
  generatedAt: string;
}

const VALID_ENTITY_TYPES = new Set([
  "tool", "model", "agent", "skill", "script", "benchmark",
]);

const TYPE_COLORS: Record<string, string> = {
  tool: "bg-circuit/20 text-circuit",
  model: "bg-purple-500/20 text-purple-400",
  agent: "bg-amber-500/20 text-amber-400",
  skill: "bg-emerald-500/20 text-emerald-400",
  script: "bg-sky-500/20 text-sky-400",
  benchmark: "bg-rose-500/20 text-rose-400",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDateRange(weekOf: string, weekEnd: string): string {
  const fmt = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  return `${fmt(weekOf)} — ${fmt(weekEnd)}`;
}

function relativeWeek(weekOf: string): string {
  const now = new Date();
  const week = new Date(weekOf + "T00:00:00");
  const diff = Math.floor((now.getTime() - week.getTime()) / (7 * 24 * 60 * 60 * 1000));
  if (diff === 0) return "This week";
  if (diff === 1) return "Last week";
  return `${diff} weeks ago`;
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider",
        TYPE_COLORS[type] || "bg-surface text-text-muted",
      )}
    >
      {type}
    </span>
  );
}

function EntityRow({ entity }: { entity: DigestEntity }) {
  const hasLink = VALID_ENTITY_TYPES.has(entity.type);
  const href = `/${entity.type}/${entity.slug}`;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <TypeBadge type={entity.type} />
      {hasLink ? (
        <Link
          href={href}
          className="text-sm text-text hover:text-circuit transition-colors truncate"
        >
          {entity.name}
        </Link>
      ) : (
        <span className="text-sm text-text truncate">{entity.name}</span>
      )}
      {entity.provider && (
        <span className="text-xs text-text-muted ml-auto shrink-0">
          {entity.provider}
        </span>
      )}
    </div>
  );
}

function MoverRow({ mover }: { mover: DigestMover }) {
  const isUp = mover.direction === "up";
  const hasLink = VALID_ENTITY_TYPES.has(mover.type);
  const href = `/${mover.type}/${mover.slug}`;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
          isUp
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-red-500/20 text-red-400",
        )}
      >
        {isUp ? "\u2191" : "\u2193"}
      </span>
      <TypeBadge type={mover.type} />
      {hasLink ? (
        <Link
          href={href}
          className="text-sm text-text hover:text-circuit transition-colors truncate"
        >
          {mover.name}
        </Link>
      ) : (
        <span className="text-sm text-text truncate">{mover.name}</span>
      )}
      <span
        className={cn(
          "text-xs font-mono ml-auto shrink-0",
          isUp ? "text-emerald-400" : "text-red-400",
        )}
      >
        {isUp ? "+" : ""}
        {mover.delta} {mover.metric}
      </span>
    </div>
  );
}

function AgentHealthBar({
  agentRuns,
}: {
  agentRuns: WeeklyDigest["agentRuns"];
}) {
  if (agentRuns.total === 0) {
    return (
      <div className="text-xs text-text-muted font-mono">
        No agent runs recorded
      </div>
    );
  }

  const successPct = Math.round((agentRuns.successful / agentRuns.total) * 100);
  const failPct = 100 - successPct;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-text-muted">
          {agentRuns.total} runs total
        </span>
        <span className="text-text-muted">
          <span className="text-emerald-400">{agentRuns.successful} ok</span>
          {agentRuns.failed > 0 && (
            <>
              {" / "}
              <span className="text-red-400">{agentRuns.failed} failed</span>
            </>
          )}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface overflow-hidden flex">
        {successPct > 0 && (
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${successPct}%` }}
          />
        )}
        {failPct > 0 && (
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${failPct}%` }}
          />
        )}
      </div>
    </div>
  );
}

function DigestCard({
  digest,
  defaultExpanded,
}: {
  digest: WeeklyDigest;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-text truncate">
            {formatDateRange(digest.weekOf, digest.weekEnd)}
          </h2>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            {relativeWeek(digest.weekOf)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-text-muted">
            <span>{digest.newEntities.length} new</span>
            <span className="text-border">|</span>
            <span>{digest.topMovers.length} movers</span>
          </div>
          <svg
            className={cn(
              "w-4 h-4 text-text-muted transition-transform",
              expanded && "rotate-180",
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-5 space-y-6">
          {/* Highlights */}
          {digest.highlights.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
                Highlights
              </h3>
              <ul className="space-y-1.5">
                {digest.highlights.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-text"
                  >
                    <span className="text-circuit mt-0.5 shrink-0">
                      &#8226;
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* New Entities */}
          {digest.newEntities.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
                New Entities ({digest.newEntities.length})
              </h3>
              <div className="space-y-0.5">
                {digest.newEntities.map((entity, i) => (
                  <EntityRow key={i} entity={entity} />
                ))}
              </div>
            </div>
          )}

          {/* Top Movers */}
          {digest.topMovers.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
                Top Movers ({digest.topMovers.length})
              </h3>
              <div className="space-y-0.5">
                {digest.topMovers.map((mover, i) => (
                  <MoverRow key={i} mover={mover} />
                ))}
              </div>
            </div>
          )}

          {/* Submissions */}
          {digest.approvedSubmissions > 0 && (
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Approved Submissions
              </h3>
              <span className="text-sm font-semibold text-emerald-400">
                {digest.approvedSubmissions}
              </span>
            </div>
          )}

          {/* Agent Health */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
              Agent Health
            </h3>
            <AgentHealthBar agentRuns={digest.agentRuns} />
          </div>

          {/* Generated timestamp */}
          <p className="text-[10px] font-mono text-text-muted text-right">
            Generated {new Date(digest.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="px-5 py-4 space-y-2">
            <div className="h-5 w-64 bg-surface rounded animate-pulse" />
            <div className="h-3 w-24 bg-surface rounded animate-pulse" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function DigestClient() {
  const [digests, setDigests] = useState<WeeklyDigest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDigests = useCallback(async () => {
    try {
      const res = await fetch("/api/digests");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: WeeklyDigest[] = await res.json();
      setDigests(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load digests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDigests();
  }, [fetchDigests]);

  if (loading) return <LoadingSkeleton />;

  if (error && digests.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-sm font-mono text-red-500 mb-2">
          Failed to load digests
        </p>
        <p className="text-xs text-text-muted">{error}</p>
        <button
          onClick={fetchDigests}
          className="mt-4 text-xs font-mono uppercase tracking-wider text-circuit hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (digests.length === 0) {
    return (
      <Card className="text-center py-16">
        <div className="text-4xl mb-4 opacity-30">
          <svg
            className="w-12 h-12 mx-auto text-text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className="text-sm text-text-muted font-mono">
          No digests generated yet.
        </p>
        <p className="text-xs text-text-muted mt-1">
          The digest agent runs weekly to compose activity summaries.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {digests.map((digest, index) => (
        <DigestCard
          key={digest.id}
          digest={digest}
          defaultExpanded={index === 0}
        />
      ))}
    </div>
  );
}
