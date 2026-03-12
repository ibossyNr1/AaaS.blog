"use client";

import { cn } from "@aaas/ui";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  color = "var(--color-circuit, #00f3ff)",
  className,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={cn("inline-block", className)}
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
  const gradientId = `sparkline-grad-${Math.random().toString(36).slice(2, 8)}`;

  // Build fill path: line path + close along bottom
  const fillPath =
    `M ${points[0].x},${points[0].y} ` +
    points.slice(1).map((p) => `L ${p.x},${p.y}`).join(" ") +
    ` L ${lastPoint.x},${height} L ${points[0].x},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("inline-block", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
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
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={2}
        fill={color}
      />
    </svg>
  );
}
