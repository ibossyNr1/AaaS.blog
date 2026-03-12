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

export default async function EmbedBadgePage({
  params,
  searchParams,
}: PageProps) {
  const { type, slug } = await params;
  const { theme: themeParam } = await searchParams;

  if (!VALID_TYPES.has(type)) notFound();

  const entity = await getEntity(type as EntityType, slug);
  if (!entity) notFound();

  const grade = computeGrade(entity.scores.composite);
  const isDark = themeParam !== "light";

  const bg = isDark ? "#0a0a0b" : "#fafaf8";
  const cardBg = isDark ? "#111113" : "#ffffff";
  const borderColor = isDark ? "#222" : "#e0e0de";
  const textPrimary = isDark ? "#ffffff" : "#1a1a1a";
  const textSecondary = isDark ? "#888" : "#666";
  const circuit = isDark ? "#00f3ff" : "#0088a0";

  const gradeColorMap: Record<string, { text: string; bg: string }> = {
    "text-emerald-400": {
      text: isDark ? "#34d399" : "#059669",
      bg: isDark ? "rgba(16,185,129,0.15)" : "rgba(5,150,105,0.12)",
    },
    "text-circuit": {
      text: circuit,
      bg: isDark ? "rgba(0,243,255,0.15)" : "rgba(0,136,160,0.12)",
    },
    "text-amber-400": {
      text: isDark ? "#fbbf24" : "#d97706",
      bg: isDark ? "rgba(251,191,36,0.15)" : "rgba(217,119,6,0.12)",
    },
    "text-orange-400": {
      text: isDark ? "#fb923c" : "#ea580c",
      bg: isDark ? "rgba(251,146,60,0.15)" : "rgba(234,88,12,0.12)",
    },
    "text-red-400": {
      text: isDark ? "#f87171" : "#dc2626",
      bg: isDark ? "rgba(248,113,113,0.15)" : "rgba(220,38,38,0.12)",
    },
  };

  const gradeStyle = gradeColorMap[grade.color] || gradeColorMap["text-circuit"];

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
        }}
      >
        <div
          style={{
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Grade circle */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: gradeStyle.bg,
              border: `2px solid ${gradeStyle.text}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: gradeStyle.text,
                fontFamily: "monospace",
                lineHeight: 1,
              }}
            >
              {grade.letter}
            </span>
          </div>

          {/* Info */}
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: textPrimary,
                marginBottom: 2,
              }}
            >
              {entity.name}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: gradeStyle.text,
                fontFamily: "monospace",
                lineHeight: 1.2,
              }}
            >
              {Math.round(entity.scores.composite)}
              <span style={{ fontSize: 13, color: textSecondary }}>/100</span>
            </div>
            <div style={{ fontSize: 10, color: textSecondary, marginTop: 4 }}>
              aaas.blog/{entity.type}/{entity.slug}
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
