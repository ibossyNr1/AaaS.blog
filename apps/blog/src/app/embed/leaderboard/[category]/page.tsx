import { notFound } from "next/navigation";
import { getLeaderboard } from "@/lib/entities";
import { computeGrade } from "@/lib/grades";
import { ENTITY_TYPES } from "@/lib/types";
import type { EntityType } from "@/lib/types";

const VALID_CATEGORIES = new Set<string>([
  "all",
  ...Object.keys(ENTITY_TYPES),
]);

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ theme?: string; limit?: string }>;
}

export default async function EmbedLeaderboardPage({
  params,
  searchParams,
}: PageProps) {
  const { category } = await params;
  const { theme: themeParam, limit: limitParam } = await searchParams;

  if (!VALID_CATEGORIES.has(category)) notFound();

  const max = Math.min(
    25,
    Math.max(1, parseInt(limitParam || "10", 10) || 10)
  );
  const entities = await getLeaderboard(
    category as EntityType | "all",
    max
  );

  const isDark = themeParam !== "light";

  const bg = isDark ? "#0a0a0b" : "#fafaf8";
  const cardBg = isDark ? "#111113" : "#ffffff";
  const borderColor = isDark ? "#222" : "#e0e0de";
  const textPrimary = isDark ? "#ffffff" : "#1a1a1a";
  const textSecondary = isDark ? "#888" : "#666";
  const circuit = isDark ? "#00f3ff" : "#0088a0";
  const rowHover = isDark ? "#161618" : "#f5f5f3";

  const gradeColorMap: Record<string, string> = {
    "text-emerald-400": isDark ? "#34d399" : "#059669",
    "text-circuit": circuit,
    "text-amber-400": isDark ? "#fbbf24" : "#d97706",
    "text-orange-400": isDark ? "#fb923c" : "#ea580c",
    "text-red-400": isDark ? "#f87171" : "#dc2626",
  };

  const typeColorMap: Record<string, string> = {
    blue: isDark ? "#3b82f6" : "#2563eb",
    purple: isDark ? "#a78bfa" : "#7c3aed",
    green: isDark ? "#34d399" : "#059669",
    gold: isDark ? "#fbbf24" : "#d97706",
    pink: isDark ? "#f472b6" : "#db2777",
    circuit,
  };

  const title =
    category === "all"
      ? "Top Entities"
      : `Top ${ENTITY_TYPES[category as EntityType]?.plural || category}`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        padding: 12,
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "auto",
      }}
    >
      <div
        style={{
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${borderColor}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: textPrimary,
              margin: 0,
            }}
          >
            {title}
          </h3>
          <span style={{ fontSize: 11, color: textSecondary }}>
            aaas.blog
          </span>
        </div>

        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "32px 1fr 60px 50px 44px",
            padding: "8px 16px",
            borderBottom: `1px solid ${borderColor}`,
            fontSize: 10,
            fontWeight: 600,
            color: textSecondary,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <span>#</span>
          <span>Name</span>
          <span style={{ textAlign: "center" }}>Type</span>
          <span style={{ textAlign: "right" }}>Score</span>
          <span style={{ textAlign: "right" }}>Grade</span>
        </div>

        {/* Rows */}
        {entities.map((entity, i) => {
          const grade = computeGrade(entity.scores.composite);
          const gradeColor = gradeColorMap[grade.color] || circuit;
          const typeInfo = ENTITY_TYPES[entity.type];
          const typeColor = typeColorMap[typeInfo.color] || circuit;

          return (
            <a
              key={`${entity.type}-${entity.slug}`}
              href={`https://aaas.blog/${entity.type}/${entity.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 60px 50px 44px",
                padding: "10px 16px",
                borderBottom:
                  i < entities.length - 1
                    ? `1px solid ${borderColor}`
                    : "none",
                textDecoration: "none",
                color: "inherit",
                alignItems: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = rowHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: textSecondary,
                  fontFamily: "monospace",
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: textPrimary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entity.name}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: typeColor,
                  textAlign: "center",
                }}
              >
                {typeInfo.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: textSecondary,
                  textAlign: "right",
                }}
              >
                {Math.round(entity.scores.composite)}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: gradeColor,
                  textAlign: "right",
                }}
              >
                {grade.letter}
              </span>
            </a>
          );
        })}

        {entities.length === 0 && (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: textSecondary,
              fontSize: 13,
            }}
          >
            No entities found.
          </div>
        )}
      </div>
    </div>
  );
}
