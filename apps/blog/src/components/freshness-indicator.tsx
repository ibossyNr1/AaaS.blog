"use client";

import { cn } from "@aaas/ui";

interface FreshnessIndicatorProps {
  ageHours: number;
  collection: string;
  className?: string;
}

function formatAge(hours: number): string {
  if (hours < 1) return "<1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function FreshnessIndicator({
  ageHours,
  collection: _collection,
  className,
}: FreshnessIndicatorProps) {
  const isFresh = ageHours < 6;
  const isAging = ageHours >= 6 && ageHours < 24;
  const isStale = ageHours >= 24;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded",
        isFresh && "text-circuit bg-circuit/10",
        isAging && "text-amber-400 bg-amber-500/10",
        isStale && "text-red-400 bg-red-500/10",
        className,
      )}
      title={`${_collection}: ${formatAge(ageHours)}`}
    >
      <span
        className={cn(
          "inline-block w-1.5 h-1.5 rounded-full",
          isFresh && "bg-circuit",
          isAging && "bg-amber-500",
          isStale && "bg-red-500",
        )}
      />
      {formatAge(ageHours)}
    </span>
  );
}
