"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, cn } from "@aaas/ui";

interface Change {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: "added" | "modified" | "removed";
}

interface ChangelogEntry {
  id: string;
  timestamp: string;
  detectedBy: string;
  changes: Change[];
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isArrayValue(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/** Compute added/removed items between two arrays */
function diffArrays(
  before: unknown[],
  after: unknown[],
): { added: string[]; removed: string[] } {
  const beforeSet = new Set(before.map(stringifyValue));
  const afterSet = new Set(after.map(stringifyValue));

  const added: string[] = [];
  const removed: string[] = [];

  for (const item of afterSet) {
    if (!beforeSet.has(item)) added.push(item);
  }
  for (const item of beforeSet) {
    if (!afterSet.has(item)) removed.push(item);
  }

  return { added, removed };
}

function ArrayDiff({ before, after }: { before: unknown; after: unknown }) {
  const beforeArr = isArrayValue(before) ? before : [];
  const afterArr = isArrayValue(after) ? after : [];
  const { added, removed } = diffArrays(beforeArr, afterArr);

  if (added.length === 0 && removed.length === 0) {
    return <span className="text-text-muted text-xs font-mono">no change</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {removed.map((item, i) => (
        <span
          key={`rm-${i}`}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-red-500/10 text-red-400 line-through"
        >
          {item}
        </span>
      ))}
      {added.map((item, i) => (
        <span
          key={`add-${i}`}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-green-500/10 text-green-400"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function ScalarDiff({ oldValue, newValue, changeType }: Change) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono min-w-0">
      {changeType !== "added" && (
        <span className="text-red-400 line-through truncate max-w-[220px]" title={stringifyValue(oldValue)}>
          {stringifyValue(oldValue)}
        </span>
      )}
      {changeType === "modified" && (
        <span className="text-text-muted shrink-0">&rarr;</span>
      )}
      {changeType !== "removed" && (
        <span className="text-green-400 truncate max-w-[220px]" title={stringifyValue(newValue)}>
          {stringifyValue(newValue)}
        </span>
      )}
    </div>
  );
}

function ChangeRow({ change }: { change: Change }) {
  const isArray =
    isArrayValue(change.oldValue) || isArrayValue(change.newValue);

  return (
    <div className="flex items-start gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs font-mono text-text-muted w-32 shrink-0 pt-0.5 truncate" title={change.field}>
        {change.field}
      </span>
      <div className="min-w-0 flex-1">
        {isArray ? (
          <ArrayDiff before={change.oldValue} after={change.newValue} />
        ) : (
          <ScalarDiff {...change} />
        )}
      </div>
    </div>
  );
}

export function EntityDiffViewer({
  type,
  slug,
}: {
  type: string;
  slug: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchData = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entity/${type}/${slug}/changelog`);
      if (!res.ok) {
        throw new Error(`Failed to fetch changelog (${res.status})`);
      }
      const json = await res.json();
      // The changelog API returns { data: [...], count } or an array directly
      const data = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
      setEntries(data);
      setFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load version diffs");
    } finally {
      setLoading(false);
    }
  }, [type, slug, fetched]);

  useEffect(() => {
    if (expanded && !fetched) {
      fetchData();
    }
  }, [expanded, fetched, fetchData]);

  return (
    <section className="py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-2 text-sm font-mono tracking-wide uppercase",
            "text-circuit hover:opacity-80 transition-opacity",
          )}
        >
          <svg
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              expanded && "rotate-90",
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          Version Diff
        </button>

        {expanded && (
          <div className="mt-6 space-y-6">
            {loading && (
              <p className="text-text-muted text-sm font-mono animate-pulse">
                Loading version diffs...
              </p>
            )}

            {error && (
              <p className="text-red-500 text-sm font-mono">{error}</p>
            )}

            {!loading && !error && entries.length === 0 && fetched && (
              <p className="text-text-muted text-sm">
                No version history available
              </p>
            )}

            {entries.map((entry) => (
              <Card
                key={entry.id}
                variant="glass"
                className="bg-surface border border-border p-4"
              >
                {/* Group header */}
                <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border">
                  <span className="text-xs font-mono text-text-muted">
                    {formatDate(entry.timestamp)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono",
                      "bg-circuit/10 text-circuit border border-circuit/20",
                    )}
                  >
                    {entry.changes.length} change{entry.changes.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Change rows */}
                <div>
                  {entry.changes.map((change, i) => (
                    <ChangeRow key={`${entry.id}-${change.field}-${i}`} change={change} />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
