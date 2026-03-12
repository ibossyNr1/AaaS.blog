"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MonitorData {
  pageLoadTime: number;
  renderCount: number;
  memoryUsage: string;
  activeApiCalls: number;
}

/**
 * Dev-mode performance overlay. Only renders in development.
 * Toggle with Ctrl+Shift+P.
 */
export function PerformanceMonitor() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<MonitorData>({
    pageLoadTime: 0,
    renderCount: 0,
    memoryUsage: "N/A",
    activeApiCalls: 0,
  });
  const renderCountRef = useRef(0);
  const apiCallCountRef = useRef(0);

  // Track keyboard shortcut
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Collect metrics
  const collect = useCallback(() => {
    renderCountRef.current++;

    // Page load time
    let pageLoadTime = 0;
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming;
      pageLoadTime = Math.round(nav.loadEventEnd - nav.startTime);
    }

    // Memory usage
    let memoryUsage = "N/A";
    const perf = performance as unknown as {
      memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
    };
    if (perf.memory) {
      const usedMB = (perf.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
      const limitMB = (perf.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0);
      memoryUsage = `${usedMB} / ${limitMB} MB`;
    }

    // Active API calls (estimate from resource timing)
    const resources = performance.getEntriesByType("resource");
    const recentApi = resources.filter((r) => {
      const res = r as PerformanceResourceTiming;
      return (
        res.name.includes("/api/") &&
        res.responseEnd === 0 // still pending
      );
    });
    apiCallCountRef.current = recentApi.length;

    setData({
      pageLoadTime,
      renderCount: renderCountRef.current,
      memoryUsage,
      activeApiCalls: apiCallCountRef.current,
    });
  }, []);

  // Poll metrics while visible
  useEffect(() => {
    if (!visible || process.env.NODE_ENV !== "development") return;

    collect();
    const interval = setInterval(collect, 1000);
    return () => clearInterval(interval);
  }, [visible, collect]);

  if (process.env.NODE_ENV !== "development") return null;
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 99999,
        background: "rgba(8, 8, 9, 0.92)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(0, 243, 255, 0.2)",
        borderRadius: 8,
        padding: "12px 16px",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 11,
        color: "#e0e0e0",
        minWidth: 220,
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ color: "#00f3ff", fontWeight: 600, fontSize: 10, letterSpacing: 1 }}>
          PERF MONITOR
        </span>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: "none",
            border: "none",
            color: "#666",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
            padding: 0,
          }}
        >
          x
        </button>
      </div>

      <Row label="Page Load" value={`${data.pageLoadTime}ms`} />
      <Row label="Renders" value={String(data.renderCount)} />
      <Row label="Memory" value={data.memoryUsage} />
      <Row label="API Calls" value={String(data.activeApiCalls)} />

      <div
        style={{
          marginTop: 8,
          paddingTop: 6,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          color: "#555",
          fontSize: 9,
        }}
      >
        Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "2px 0",
      }}
    >
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ color: "#00f3ff" }}>{value}</span>
    </div>
  );
}
