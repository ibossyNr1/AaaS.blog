"use client";

import { cn } from "@aaas/ui";

type SkeletonVariant = "line" | "circle" | "card" | "table" | "chart";

interface LoadingSkeletonProps {
  variant: SkeletonVariant;
  count?: number;
  className?: string;
}

const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 rounded bg-surface/60",
        shimmer,
        className,
      )}
    />
  );
}

function SkeletonCircle({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-10 w-10 rounded-full bg-surface/60",
        shimmer,
        className,
      )}
    />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface/30 p-5 space-y-3",
        className,
      )}
    >
      <div className={cn("h-4 w-2/3 rounded bg-surface/60", shimmer)} />
      <div className={cn("h-3 w-full rounded bg-surface/60", shimmer)} />
      <div className={cn("h-3 w-4/5 rounded bg-surface/60", shimmer)} />
      <div className="flex gap-2 pt-1">
        <div className={cn("h-5 w-14 rounded-full bg-surface/60", shimmer)} />
        <div className={cn("h-5 w-14 rounded-full bg-surface/60", shimmer)} />
      </div>
    </div>
  );
}

function SkeletonTable({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", className)}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-surface/40 border-b border-border">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("h-3 flex-1 rounded bg-surface/60", shimmer)} />
        ))}
      </div>
      {/* Rows */}
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="flex gap-4 px-4 py-3 border-b border-border last:border-0">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className={cn("h-3 flex-1 rounded bg-surface/60", shimmer)} />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonChart({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface/30 p-5",
        className,
      )}
    >
      <div className={cn("h-4 w-1/3 rounded bg-surface/60 mb-4", shimmer)} />
      <div className="flex items-end gap-2 h-32">
        {[40, 65, 30, 80, 55, 70, 45, 90, 60, 50].map((h, i) => (
          <div
            key={i}
            className={cn("flex-1 rounded-t bg-surface/60", shimmer)}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  variant,
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  switch (variant) {
    case "line":
      return (
        <div className={cn("space-y-2", className)}>
          {items.map((i) => (
            <SkeletonLine key={i} />
          ))}
        </div>
      );
    case "circle":
      return (
        <div className={cn("flex gap-3", className)}>
          {items.map((i) => (
            <SkeletonCircle key={i} />
          ))}
        </div>
      );
    case "card":
      return (
        <div className={cn("grid gap-4", className)}>
          {items.map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    case "table":
      return (
        <div className={cn("space-y-4", className)}>
          {items.map((i) => (
            <SkeletonTable key={i} />
          ))}
        </div>
      );
    case "chart":
      return (
        <div className={cn("space-y-4", className)}>
          {items.map((i) => (
            <SkeletonChart key={i} />
          ))}
        </div>
      );
    default:
      return null;
  }
}
