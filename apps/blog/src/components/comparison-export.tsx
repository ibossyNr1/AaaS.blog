"use client";

import { useState, useCallback } from "react";
import { Card, cn } from "@aaas/ui";
import type { Entity } from "@/lib/types";
import { computeGrade } from "@/lib/grades";

/* -------------------------------------------------------------------------- */
/*  Icons (inline SVGs to avoid external deps)                                 */
/* -------------------------------------------------------------------------- */

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function JsonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h2a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2 2 2 0 0 0-2 2v1a2 2 0 0 1-2 2H4" />
      <path d="M20 6h-2a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2 2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
    </svg>
  );
}

function MarkdownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const SCORE_KEYS = ["composite", "adoption", "quality", "freshness", "citations", "engagement"] as const;

const FIELD_KEYS = [
  "name", "type", "provider", "version", "category", "pricingModel", "license", "url",
] as const;

function getField(entity: Entity, key: string): string {
  const val = (entity as unknown as Record<string, unknown>)[key];
  if (val == null) return "";
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
}

function buildShareUrl(entities: Entity[]): string {
  const encoded = entities.map((e) => `${e.type}:${e.slug}`).join(",");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/compare?e=${encodeURIComponent(encoded)}`;
}

function buildJsonExport(entities: Entity[]) {
  return entities.map((e) => ({
    name: e.name,
    type: e.type,
    slug: e.slug,
    provider: e.provider,
    version: e.version,
    category: e.category,
    pricingModel: e.pricingModel,
    license: e.license,
    url: e.url,
    capabilities: e.capabilities,
    integrations: e.integrations,
    tags: e.tags,
    scores: e.scores,
    grade: computeGrade(e.scores.composite).letter,
  }));
}

function buildCsvExport(entities: Entity[]): string {
  const headers = [
    "Name", "Type", "Slug", "Provider", "Version", "Category",
    "Pricing", "License", "URL", "Grade",
    ...SCORE_KEYS.map((k) => `Score: ${k}`),
    "Capabilities", "Integrations", "Tags",
  ];

  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = entities.map((e) => [
    e.name, e.type, e.slug, e.provider, e.version, e.category,
    e.pricingModel, e.license, e.url,
    computeGrade(e.scores.composite).letter,
    ...SCORE_KEYS.map((k) => String(e.scores[k])),
    e.capabilities.join("; "),
    e.integrations.join("; "),
    e.tags.join("; "),
  ]);

  return [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");
}

function buildMarkdownExport(entities: Entity[]): string {
  const lines: string[] = [];

  lines.push(`# Entity Comparison`);
  lines.push("");
  lines.push(`*Generated ${new Date().toISOString().split("T")[0]}*`);
  lines.push("");

  // Field comparison table
  lines.push("## Fields");
  lines.push("");
  const headerRow = ["Field", ...entities.map((e) => e.name)];
  lines.push(`| ${headerRow.join(" | ")} |`);
  lines.push(`| ${headerRow.map(() => "---").join(" | ")} |`);

  for (const key of FIELD_KEYS) {
    const row = [key, ...entities.map((e) => getField(e, key) || "—")];
    lines.push(`| ${row.join(" | ")} |`);
  }
  // Grade row
  const gradeRow = ["Grade", ...entities.map((e) => computeGrade(e.scores.composite).letter)];
  lines.push(`| ${gradeRow.join(" | ")} |`);
  lines.push("");

  // Score comparison table
  lines.push("## Scores");
  lines.push("");
  const scoreHeader = ["Metric", ...entities.map((e) => e.name)];
  lines.push(`| ${scoreHeader.join(" | ")} |`);
  lines.push(`| ${scoreHeader.map(() => "---").join(" | ")} |`);

  for (const key of SCORE_KEYS) {
    const row = [key, ...entities.map((e) => String(e.scores[key]))];
    lines.push(`| ${row.join(" | ")} |`);
  }
  lines.push("");

  // Capabilities
  lines.push("## Capabilities");
  lines.push("");
  for (const e of entities) {
    lines.push(`**${e.name}**: ${e.capabilities.join(", ") || "—"}`);
    lines.push("");
  }

  // Integrations
  lines.push("## Integrations");
  lines.push("");
  for (const e of entities) {
    lines.push(`**${e.name}**: ${e.integrations.join(", ") || "—"}`);
    lines.push("");
  }

  return lines.join("\n");
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------------- */
/*  Toast                                                                      */
/* -------------------------------------------------------------------------- */

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded",
        "bg-circuit text-base font-mono text-sm shadow-lg",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
      )}
    >
      {message}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ComparisonExport                                                           */
/* -------------------------------------------------------------------------- */

export function ComparisonExport({ entities }: { entities: Entity[] }) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = buildShareUrl(entities);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Copied!");
    } catch {
      showToast("Failed to copy");
    }
  }, [entities, showToast]);

  const handleExportJson = useCallback(() => {
    const data = buildJsonExport(entities);
    const json = JSON.stringify(data, null, 2);
    const slugs = entities.map((e) => e.slug).join("-vs-");
    downloadBlob(json, `comparison-${slugs}.json`, "application/json");
    showToast("Downloaded!");
  }, [entities, showToast]);

  const handleExportCsv = useCallback(() => {
    const csv = buildCsvExport(entities);
    const slugs = entities.map((e) => e.slug).join("-vs-");
    downloadBlob(csv, `comparison-${slugs}.csv`, "text/csv");
    showToast("Downloaded!");
  }, [entities, showToast]);

  const handleExportMarkdown = useCallback(() => {
    const md = buildMarkdownExport(entities);
    const slugs = entities.map((e) => e.slug).join("-vs-");
    downloadBlob(md, `comparison-${slugs}.md`, "text/markdown");
    showToast("Downloaded!");
  }, [entities, showToast]);

  const buttons = [
    { label: "Copy Link", icon: LinkIcon, onClick: handleCopyLink },
    { label: "Export JSON", icon: JsonIcon, onClick: handleExportJson },
    { label: "Export CSV", icon: TableIcon, onClick: handleExportCsv },
    { label: "Export Markdown", icon: MarkdownIcon, onClick: handleExportMarkdown },
  ] as const;

  return (
    <>
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted shrink-0">
            Export Comparison
          </span>
          <div className="flex flex-wrap gap-2">
            {buttons.map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono",
                  "border border-border bg-surface text-text",
                  "hover:border-circuit hover:text-circuit transition-colors",
                )}
              >
                <Icon className="shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <Toast message={toast ?? ""} visible={toast !== null} />
    </>
  );
}
