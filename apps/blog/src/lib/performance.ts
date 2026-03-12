// ---------------------------------------------------------------------------
// Performance monitoring — ring-buffer metrics collector
// ---------------------------------------------------------------------------

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  tags?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Ring buffer (bounded memory)
// ---------------------------------------------------------------------------

const MAX_METRICS = 1000;
const metrics: PerformanceMetric[] = [];
let writeIndex = 0;
let totalWritten = 0;

function pushMetric(metric: PerformanceMetric): void {
  if (totalWritten < MAX_METRICS) {
    metrics.push(metric);
  } else {
    metrics[writeIndex % MAX_METRICS] = metric;
  }
  writeIndex = (writeIndex + 1) % MAX_METRICS;
  totalWritten++;
}

function getMetrics(): PerformanceMetric[] {
  // Return metrics in chronological order
  if (totalWritten <= MAX_METRICS) return [...metrics];

  const start = writeIndex % MAX_METRICS;
  return [...metrics.slice(start), ...metrics.slice(0, start)];
}

// ---------------------------------------------------------------------------
// measure — wraps an async function with timing
// ---------------------------------------------------------------------------

export async function measure<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    pushMetric({
      name,
      duration: performance.now() - start,
      timestamp: Date.now(),
      tags,
    });
    return result;
  } catch (err) {
    pushMetric({
      name,
      duration: performance.now() - start,
      timestamp: Date.now(),
      tags: { ...tags, error: "true" },
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// reportWebVitals — logs Core Web Vitals
// ---------------------------------------------------------------------------

export function reportWebVitals(metric: {
  name: string;
  value: number;
  label: string;
}): void {
  pushMetric({
    name: `web-vital:${metric.name}`,
    duration: metric.value,
    timestamp: Date.now(),
    tags: { label: metric.label },
  });

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(
      `[web-vital] ${metric.name} = ${metric.value.toFixed(1)}ms (${metric.label})`,
    );
  }
}

// ---------------------------------------------------------------------------
// getPerformanceReport — aggregate statistics
// ---------------------------------------------------------------------------

export function getPerformanceReport(): {
  avgResponseTime: number;
  p95ResponseTime: number;
  metrics: PerformanceMetric[];
} {
  const all = getMetrics();

  if (all.length === 0) {
    return { avgResponseTime: 0, p95ResponseTime: 0, metrics: [] };
  }

  const durations = all.map((m) => m.duration).sort((a, b) => a - b);
  const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
  const p95Index = Math.min(
    Math.ceil(durations.length * 0.95) - 1,
    durations.length - 1,
  );

  return {
    avgResponseTime: Math.round(avg * 100) / 100,
    p95ResponseTime: durations[p95Index],
    metrics: all,
  };
}
