"use client";

import { cn } from "@aaas/ui";

interface AgentStatusDotProps {
  status: "ok" | "warning" | "error" | "stale";
  className?: string;
}

const STATUS_COLORS: Record<AgentStatusDotProps["status"], string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  stale: "bg-neutral-500",
};

const STATUS_LABELS: Record<AgentStatusDotProps["status"], string> = {
  ok: "Healthy",
  warning: "Warning",
  error: "Error",
  stale: "Stale",
};

export function AgentStatusDot({ status, className }: AgentStatusDotProps) {
  return (
    <span
      className={cn(
        "relative inline-block w-2.5 h-2.5 rounded-full shrink-0",
        STATUS_COLORS[status],
        status === "error" && "animate-pulse",
        className,
      )}
      title={STATUS_LABELS[status]}
    >
      {status === "error" && (
        <span
          className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50"
          aria-hidden
        />
      )}
    </span>
  );
}
