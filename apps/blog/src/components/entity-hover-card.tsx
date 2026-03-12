"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@aaas/ui";
import { cn } from "@aaas/ui";
import { computeGrade } from "@/lib/grades";
import type { Entity } from "@/lib/types";

/* ── Module-level cache ── */
const entityCache = new Map<string, Entity>();

interface EntityHoverCardProps {
  type: string;
  slug: string;
  children: React.ReactNode;
}

export function EntityHoverCard({ type, slug, children }: EntityHoverCardProps) {
  const [visible, setVisible] = useState(false);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<"above" | "below">("below");

  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const cacheKey = `${type}/${slug}`;

  const fetchEntity = useCallback(async () => {
    if (entityCache.has(cacheKey)) {
      setEntity(entityCache.get(cacheKey)!);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/entity/${type}/${slug}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) {
        entityCache.set(cacheKey, json.data);
        setEntity(json.data);
      }
    } catch {
      // Silently fail — hover preview is non-critical
    } finally {
      setLoading(false);
    }
  }, [type, slug, cacheKey]);

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    // Card is roughly 200px tall; prefer below unless not enough space
    setPosition(spaceBelow < 220 && spaceAbove > spaceBelow ? "above" : "below");
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    showTimerRef.current = setTimeout(() => {
      computePosition();
      setVisible(true);
      fetchEntity();
    }, 300);
  }, [fetchEntity, computePosition]);

  const handleMouseLeave = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const grade = entity ? computeGrade(entity.scores?.composite ?? 0) : null;

  return (
    <span
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {visible && (
        <div
          ref={cardRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "absolute left-1/2 z-[45] w-72",
            "bg-surface border border-border rounded-lg shadow-lg p-4",
            "transition-opacity duration-150",
            position === "above" ? "bottom-full mb-2" : "top-full mt-2"
          )}
          style={{
            transform: "translateX(-50%)",
            opacity: 1,
          }}
        >
          {loading && !entity ? (
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-surface rounded animate-pulse border border-border" />
              <div className="h-3 w-full bg-surface rounded animate-pulse border border-border" />
              <div className="h-3 w-2/3 bg-surface rounded animate-pulse border border-border" />
            </div>
          ) : entity ? (
            <div className="space-y-2.5">
              {/* Name + type badge */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-text leading-tight">
                  {entity.name}
                </h4>
                <Badge variant="circuit" className="shrink-0 text-[10px] py-0.5 px-1.5">
                  {entity.type}
                </Badge>
              </div>

              {/* Provider */}
              {entity.provider && (
                <p className="text-xs text-text-muted font-mono">{entity.provider}</p>
              )}

              {/* Score + grade */}
              {grade && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Score:</span>
                  <span className="text-xs font-mono text-text">
                    {entity.scores.composite}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
                      grade.color,
                      grade.bgColor
                    )}
                  >
                    {grade.letter}
                  </span>
                </div>
              )}

              {/* Description */}
              {entity.description && (
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                  {entity.description}
                </p>
              )}

              {/* Tags */}
              {entity.tags && entity.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entity.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono text-text-muted bg-base px-1.5 py-0.5 rounded border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

    </span>
  );
}
