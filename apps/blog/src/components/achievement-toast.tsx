"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@aaas/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AchievementToastData {
  id: string;
  name: string;
  icon: string;
  points: number;
}

// ---------------------------------------------------------------------------
// Global event bus for triggering toasts from anywhere
// ---------------------------------------------------------------------------

type ToastListener = (data: AchievementToastData) => void;
const listeners = new Set<ToastListener>();

export function showAchievementToast(data: AchievementToastData) {
  listeners.forEach((fn) => fn(data));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AchievementToast() {
  const [queue, setQueue] = useState<AchievementToastData[]>([]);
  const [current, setCurrent] = useState<AchievementToastData | null>(null);
  const [visible, setVisible] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Subscribe to toast events
  useEffect(() => {
    const handler: ToastListener = (data) => {
      setQueue((prev) => [...prev, data]);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  // Process queue
  useEffect(() => {
    if (current || queue.length === 0) return;

    const next = queue[0];
    setQueue((prev) => prev.slice(1));
    setCurrent(next);
    setVisible(true);
    setCelebrating(true);

    // Stop celebration particles after 2s
    const celebTimer = setTimeout(() => setCelebrating(false), 2000);

    // Auto-dismiss after 5s
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      // Clear current after exit animation
      setTimeout(() => setCurrent(null), 400);
    }, 5000);

    return () => {
      clearTimeout(celebTimer);
      clearTimeout(dismissTimer);
    };
  }, [current, queue]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setCurrent(null), 400);
  }, []);

  if (!current) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[9999] transition-all duration-400",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none",
      )}
    >
      {/* Celebration particles */}
      {celebrating && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="achievement-particle absolute"
              style={{
                left: "50%",
                top: "50%",
                animationDelay: `${i * 80}ms`,
                // Each particle gets a unique angle via CSS custom property
                ["--angle" as string]: `${(i * 30)}deg`,
              }}
            />
          ))}
        </div>
      )}

      {/* Toast card */}
      <button
        onClick={dismiss}
        className={cn(
          "relative flex items-center gap-3 px-5 py-4 rounded-xl",
          "bg-surface border border-circuit/30 shadow-lg shadow-circuit/10",
          "cursor-pointer hover:border-circuit/50 transition-colors",
          "min-w-[280px] max-w-[360px]",
        )}
      >
        {/* Icon */}
        <span className="text-3xl flex-shrink-0" role="img" aria-label="achievement">
          {current.icon}
        </span>

        {/* Text */}
        <div className="flex-1 text-left">
          <p className="text-[10px] uppercase tracking-widest text-circuit font-mono font-bold">
            Achievement Unlocked
          </p>
          <p className="text-sm font-semibold text-text mt-0.5">
            {current.name}
          </p>
          <p className="text-xs text-text-muted font-mono">
            +{current.points} points
          </p>
        </div>

        {/* Glow ring */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-circuit/20 animate-pulse pointer-events-none" />
      </button>

      {/* Inline styles for celebration particles */}
      <style jsx>{`
        @keyframes particle-burst {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-60px) scale(0);
            opacity: 0;
          }
        }

        .achievement-particle {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--circuit, #00f3ff);
          animation: particle-burst 0.8s ease-out forwards;
        }

        .achievement-particle:nth-child(even) {
          background: var(--accent-red, #F43F6C);
          width: 4px;
          height: 4px;
        }

        .achievement-particle:nth-child(3n) {
          background: var(--accent-teal, #00d4b8);
          width: 5px;
          height: 5px;
        }
      `}</style>
    </div>
  );
}
