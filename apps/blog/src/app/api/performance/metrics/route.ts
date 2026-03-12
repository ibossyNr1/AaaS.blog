import { NextRequest, NextResponse } from "next/server";
import { getPerformanceReport } from "@/lib/performance";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// In-memory store for client-side metrics
// ---------------------------------------------------------------------------

interface ClientMetric {
  name: string;
  value: number;
  label?: string;
  timestamp: number;
  userAgent?: string;
}

const MAX_CLIENT_METRICS = 5000;
const clientMetrics: ClientMetric[] = [];
let clientWriteIndex = 0;
let clientTotalWritten = 0;

function pushClientMetric(metric: ClientMetric): void {
  if (clientTotalWritten < MAX_CLIENT_METRICS) {
    clientMetrics.push(metric);
  } else {
    clientMetrics[clientWriteIndex % MAX_CLIENT_METRICS] = metric;
  }
  clientWriteIndex = (clientWriteIndex + 1) % MAX_CLIENT_METRICS;
  clientTotalWritten++;
}

// ---------------------------------------------------------------------------
// POST — receive client-side performance metrics
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 },
      );
    }

    const entries: Array<{ name: string; value: number; label?: string }> =
      Array.isArray(body) ? body : [body];

    const userAgent = req.headers.get("user-agent") ?? undefined;

    for (const entry of entries) {
      if (typeof entry.name !== "string" || typeof entry.value !== "number") {
        continue;
      }

      pushClientMetric({
        name: entry.name,
        value: entry.value,
        label: entry.label,
        timestamp: Date.now(),
        userAgent,
      });
    }

    return NextResponse.json({ ok: true, received: entries.length });
  } catch {
    return NextResponse.json(
      { error: "Failed to process metrics" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET — return aggregated metrics
// ---------------------------------------------------------------------------

export async function GET() {
  const serverReport = getPerformanceReport();

  // Aggregate client metrics
  const clientByName = new Map<string, number[]>();
  for (const m of clientMetrics) {
    const arr = clientByName.get(m.name) ?? [];
    arr.push(m.value);
    clientByName.set(m.name, arr);
  }

  const clientAggregated: Record<
    string,
    { count: number; avg: number; p95: number; min: number; max: number }
  > = {};

  for (const [name, values] of clientByName) {
    values.sort((a, b) => a - b);
    const sum = values.reduce((s, v) => s + v, 0);
    const p95Idx = Math.min(
      Math.ceil(values.length * 0.95) - 1,
      values.length - 1,
    );
    clientAggregated[name] = {
      count: values.length,
      avg: Math.round((sum / values.length) * 100) / 100,
      p95: values[p95Idx],
      min: values[0],
      max: values[values.length - 1],
    };
  }

  return NextResponse.json({
    server: {
      avgResponseTime: serverReport.avgResponseTime,
      p95ResponseTime: serverReport.p95ResponseTime,
      metricCount: serverReport.metrics.length,
    },
    client: clientAggregated,
    totalClientMetrics: clientTotalWritten,
  });
}
