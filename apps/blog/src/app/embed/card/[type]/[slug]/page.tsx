import { notFound } from "next/navigation";
import { getEntity } from "@/lib/entities";
import { computeGrade } from "@/lib/grades";
import { ENTITY_TYPES } from "@/lib/types";
import type { EntityType } from "@/lib/types";

const VALID_TYPES = new Set<string>(Object.keys(ENTITY_TYPES));

interface PageProps {
  params: Promise<{ type: string; slug: string }>;
  searchParams: Promise<{ theme?: string }>;
}

export default async function EmbedCardPage({
  params,
  searchParams,
}: PageProps) {
  const { type, slug } = await params;
  const { theme: themeParam } = await searchParams;

  if (!VALID_TYPES.has(type)) notFound();

  const entity = await getEntity(type as EntityType, slug);
  if (!entity) notFound();

  const grade = computeGrade(entity.scores.composite);
  const typeInfo = ENTITY_TYPES[entity.type];
  const isDark = themeParam !== "light";

  const bg = isDark ? "#0a0a0b" : "#fafaf8";
  const cardBg = isDark ? "#111113" : "#ffffff";
  const borderColor = isDark ? "#222" : "#e0e0de";
  const textPrimary = isDark ? "#ffffff" : "#1a1a1a";
  const textSecondary = isDark ? "#888" : "#666";
  const circuit = isDark ? "#00f3ff" : "#0088a0";

  const gradeColors: Record<string, { text: string; bg: string }> = {
    "text-emerald-400": {
      text: isDark ? "#34d399" : "#059669",
      bg: isDark ? "rgba(16,185,129,0.1)" : "rgba(5,150,105,0.1)",
    },
    "text-circuit": {
      text: circuit,
      bg: isDark ? "rgba(0,243,255,0.1)" : "rgba(0,136,160,0.1)",
    },
    "text-amber-400": {
      text: isDark ? "#fbbf24" : "#d97706",
      bg: isDark ? "rgba(251,191,36,0.1)" : "rgba(217,119,6,0.1)",
    },
    "text-orange-400": {
      text: isDark ? "#fb923c" : "#ea580c",
      bg: isDark ? "rgba(251,146,60,0.1)" : "rgba(234,88,12,0.1)",
    },
    "text-red-400": {
      text: isDark ? "#f87171" : "#dc2626",
      bg: isDark ? "rgba(248,113,113,0.1)" : "rgba(220,38,38,0.1)",
    },
  };

  const gradeStyle = gradeColors[grade.color] || gradeColors["text-circuit"];

  const typeColorMap: Record<string, string> = {
    blue: isDark ? "#3b82f6" : "#2563eb",
    purple: isDark ? "#a78bfa" : "#7c3aed",
    green: isDark ? "#34d399" : "#059669",
    gold: isDark ? "#fbbf24" : "#d97706",
    pink: isDark ? "#f472b6" : "#db2777",
    circuit,
  };
  const typeBadgeColor = typeColorMap[typeInfo.color] || circuit;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        padding: 12,
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <a
        href={`https://aaas.blog/${entity.type}/${entity.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "block",
          width: "100%",
        }}
      >
        <div
          style={{
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            padding: 20,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Header: type badge + score */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: typeBadgeColor,
                background: `${typeBadgeColor}15`,
                padding: "3px 8px",
                borderRadius: 4,
              }}
            >
              {typeInfo.label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: gradeStyle.text,
                  background: gradeStyle.bg,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                }}
              >
                {grade.letter}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: textSecondary,
                  fontFamily: "monospace",
                }}
              >
                {Math.round(entity.scores.composite)}/100
              </span>
            </div>
          </div>

          {/* Name */}
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: textPrimary,
              margin: "0 0 4px 0",
              lineHeight: 1.3,
            }}
          >
            {entity.name}
          </h3>

          {/* Provider */}
          <p
            style={{
              fontSize: 12,
              color: textSecondary,
              margin: "0 0 10px 0",
            }}
          >
            {entity.provider}
          </p>

          {/* Description */}
          <p
            style={{
              fontSize: 13,
              color: textSecondary,
              margin: 0,
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {entity.description}
          </p>

          {/* Footer */}
          <div
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: `1px solid ${borderColor}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 10, color: textSecondary }}>
              aaas.blog
            </span>
            <span style={{ fontSize: 10, color: circuit }}>View details</span>
          </div>
        </div>
      </a>
    </div>
  );
}
