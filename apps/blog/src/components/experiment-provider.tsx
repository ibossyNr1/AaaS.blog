"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ExperimentAssignment {
  experimentId: string;
  variant: string;
  assignedAt: string;
}

interface ExperimentContextValue {
  assignments: Map<string, string>;
  getVariant: (experimentId: string) => string | null;
  trackEvent: (experimentId: string, event: string, metadata?: Record<string, unknown>) => void;
}

const ExperimentContext = createContext<ExperimentContextValue>({
  assignments: new Map(),
  getVariant: () => null,
  trackEvent: () => {},
});

export function useExperiment() {
  return useContext(ExperimentContext);
}

/* -------------------------------------------------------------------------- */
/*  Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function ExperimentProvider({ children }: { children: ReactNode }) {
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());

  // Load assignments from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("aaas-experiments");
      if (stored) {
        const parsed: ExperimentAssignment[] = JSON.parse(stored);
        const map = new Map<string, string>();
        for (const a of parsed) {
          map.set(a.experimentId, a.variant);
        }
        setAssignments(map);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const getVariant = useCallback(
    (experimentId: string): string | null => {
      return assignments.get(experimentId) ?? null;
    },
    [assignments],
  );

  const trackEvent = useCallback(
    (experimentId: string, event: string, metadata?: Record<string, unknown>) => {
      try {
        // Fire-and-forget tracking via API
        fetch("/api/experiments/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            experimentId,
            event,
            variant: assignments.get(experimentId) ?? "unknown",
            timestamp: new Date().toISOString(),
            ...metadata,
          }),
        }).catch(() => {
          // Silent failure for tracking
        });
      } catch {
        // Ignore tracking errors
      }
    },
    [assignments],
  );

  return (
    <ExperimentContext.Provider value={{ assignments, getVariant, trackEvent }}>
      {children}
    </ExperimentContext.Provider>
  );
}
