"use client";

import { Card, cn } from "@aaas/ui";
import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  delta,
  deltaLabel,
  icon,
  className,
}: MetricCardProps) {
  const hasDelta = typeof delta === "number" && delta !== 0;
  const isPositive = hasDelta && delta > 0;
  const isNegative = hasDelta && delta < 0;

  return (
    <Card variant="glass" className={cn("p-5", className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
          {title}
        </span>
        {icon && (
          <span className="text-circuit opacity-70">{icon}</span>
        )}
      </div>
      <div className="text-3xl font-bold text-text tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {(hasDelta || deltaLabel) && (
        <div className="mt-2 flex items-center gap-1.5">
          {hasDelta && (
            <span
              className={cn(
                "text-sm font-mono font-medium",
                isPositive && "text-green-500",
                isNegative && "text-red-500",
              )}
            >
              {isPositive ? "+" : ""}
              {delta.toFixed(1)}%
            </span>
          )}
          {deltaLabel && (
            <span className="text-xs text-text-muted">{deltaLabel}</span>
          )}
        </div>
      )}
    </Card>
  );
}
