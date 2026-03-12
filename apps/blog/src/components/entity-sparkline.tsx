"use client";

import { useEffect, useState } from "react";
import { cn } from "@aaas/ui";
import { Sparkline } from "./sparkline";

interface EntitySparklineProps {
  type: string;
  slug: string;
  width?: number;
  height?: number;
  className?: string;
}

export function EntitySparkline({
  type,
  slug,
  width = 60,
  height = 20,
  className,
}: EntitySparklineProps) {
  const [data, setData] = useState<number[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSparkline() {
      try {
        const res = await fetch(`/api/entity/${type}/${slug}/sparkline`);
        if (!res.ok) {
          setError(true);
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          const composites = (json.data ?? []).map(
            (d: { composite: number }) => d.composite
          );
          setData(composites);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchSparkline();
    return () => {
      cancelled = true;
    };
  }, [type, slug]);

  if (error) return null;

  if (data === null) {
    return (
      <div
        className={cn(
          "animate-pulse rounded bg-surface",
          className
        )}
        style={{ width, height }}
      />
    );
  }

  return (
    <div className={cn("inline-flex flex-col items-center gap-0.5", className)}>
      <Sparkline data={data} width={width} height={height} />
      <span className="text-[9px] font-mono text-text-muted leading-none">
        30d
      </span>
    </div>
  );
}
