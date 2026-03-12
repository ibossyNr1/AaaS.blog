"use client";

import { cn } from "@aaas/ui";

interface AnalyticsSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function AnalyticsSparkline({
  data,
  width = 80,
  height = 28,
  color = "var(--color-circuit, #00f3ff)",
  className,
}: AnalyticsSparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
        >
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.4}
          />
        </svg>
        <span className="text-xs text-text-muted">--</span>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const lastPoint = points[points.length - 1];
  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  const isUp = lastValue > firstValue;
  const isDown = lastValue < firstValue;

  const gradientId = `analytics-sparkline-${Math.random().toString(36).slice(2, 8)}`;

  const fillPath =
    `M ${points[0].x},${points[0].y} ` +
    points
      .slice(1)
      .map((p) => `L ${p.x},${p.y}`)
      .join(" ") +
    ` L ${lastPoint.x},${height} L ${points[0].x},${height} Z`;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#${gradientId})`} />
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastPoint.x} cy={lastPoint.y} r={2} fill={color} />
      </svg>
      {isUp && (
        <svg width={10} height={10} viewBox="0 0 10 10" className="text-green-500">
          <path d="M5 1 L9 6 L6 6 L6 9 L4 9 L4 6 L1 6 Z" fill="currentColor" />
        </svg>
      )}
      {isDown && (
        <svg width={10} height={10} viewBox="0 0 10 10" className="text-red-500">
          <path d="M5 9 L9 4 L6 4 L6 1 L4 1 L4 4 L1 4 Z" fill="currentColor" />
        </svg>
      )}
      {!isUp && !isDown && (
        <svg width={10} height={10} viewBox="0 0 10 10" className="text-text-muted">
          <rect x={1} y={4} width={8} height={2} rx={1} fill="currentColor" />
        </svg>
      )}
    </div>
  );
}
