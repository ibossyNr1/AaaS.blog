"use client";

import { useState, useMemo, useCallback } from "react";
import { ENTITY_TYPES } from "@/lib/types";
import type { EntityType } from "@/lib/types";

type WidgetType = "card" | "leaderboard" | "badge";
type ThemeOption = "dark" | "light";

const WIDGET_INFO: Record<WidgetType, { label: string; description: string }> =
  {
    card: {
      label: "Entity Card",
      description:
        "Compact card showing entity name, type, provider, score, and grade.",
    },
    leaderboard: {
      label: "Leaderboard",
      description: "Top entities by composite score in a category.",
    },
    badge: {
      label: "Score Badge",
      description: "Large centered badge with grade letter, score, and name.",
    },
  };

const ENTITY_TYPE_OPTIONS = Object.entries(ENTITY_TYPES).map(
  ([value, info]) => ({
    value: value as EntityType,
    label: info.label,
  })
);

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Types" },
  ...ENTITY_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label + "s" })),
];

const SIZE_OPTIONS = [
  { value: "small", label: "Small (300x200)" },
  { value: "medium", label: "Medium (400x280)" },
  { value: "large", label: "Large (500x350)" },
];

const LEADERBOARD_SIZE_OPTIONS = [
  { value: "small", label: "Compact (400x300)" },
  { value: "medium", label: "Medium (500x420)" },
  { value: "large", label: "Large (600x550)" },
];

const BADGE_SIZE_OPTIONS = [
  { value: "small", label: "Small (250x120)" },
  { value: "medium", label: "Medium (300x150)" },
  { value: "large", label: "Large (400x200)" },
];

const LIMIT_OPTIONS = [
  { value: "5", label: "5 entries" },
  { value: "10", label: "10 entries" },
  { value: "25", label: "25 entries" },
];

function getSizePixels(
  widgetType: WidgetType,
  size: string
): { width: number; height: number } {
  if (widgetType === "leaderboard") {
    if (size === "small") return { width: 400, height: 300 };
    if (size === "large") return { width: 600, height: 550 };
    return { width: 500, height: 420 };
  }
  if (widgetType === "badge") {
    if (size === "small") return { width: 250, height: 120 };
    if (size === "large") return { width: 400, height: 200 };
    return { width: 300, height: 150 };
  }
  // card
  if (size === "small") return { width: 300, height: 200 };
  if (size === "large") return { width: 500, height: 350 };
  return { width: 400, height: 280 };
}

const BASE_URL = "https://aaas.blog";

export function EmbedGenerator() {
  const [widgetType, setWidgetType] = useState<WidgetType>("card");
  const [entityType, setEntityType] = useState<EntityType>("tool");
  const [slug, setSlug] = useState("langchain");
  const [theme, setTheme] = useState<ThemeOption>("dark");
  const [size, setSize] = useState("medium");
  const [category, setCategory] = useState("all");
  const [leaderboardLimit, setLeaderboardLimit] = useState("10");
  const [copied, setCopied] = useState(false);

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("theme", theme);

    if (widgetType === "card") {
      return `${BASE_URL}/embed/card/${entityType}/${slug}?${params}`;
    }
    if (widgetType === "leaderboard") {
      params.set("limit", leaderboardLimit);
      return `${BASE_URL}/embed/leaderboard/${category}?${params}`;
    }
    return `${BASE_URL}/embed/badge/${entityType}/${slug}?${params}`;
  }, [widgetType, entityType, slug, theme, category, leaderboardLimit]);

  const previewUrl = useMemo(() => {
    return embedUrl.replace(BASE_URL, "");
  }, [embedUrl]);

  const dimensions = useMemo(
    () => getSizePixels(widgetType, size),
    [widgetType, size]
  );

  const embedCode = useMemo(() => {
    return `<iframe src="${embedUrl}" width="${dimensions.width}" height="${dimensions.height}" style="border:none;border-radius:8px;" loading="lazy" title="AaaS Widget"></iframe>`;
  }, [embedUrl, dimensions]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [embedCode]);

  const sizeOptions =
    widgetType === "leaderboard"
      ? LEADERBOARD_SIZE_OPTIONS
      : widgetType === "badge"
        ? BADGE_SIZE_OPTIONS
        : SIZE_OPTIONS;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0b",
        color: "#e5e5e5",
        fontFamily:
          'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            color: "#fff",
          }}
        >
          Embed Widgets
        </h1>
        <p style={{ color: "#888", marginBottom: 40, fontSize: 15 }}>
          Generate embeddable widgets for your website or documentation.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
          }}
        >
          {/* Configuration Panel */}
          <div
            style={{
              background: "#111113",
              borderRadius: 12,
              border: "1px solid #222",
              padding: 24,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 20,
                color: "#fff",
              }}
            >
              Configuration
            </h2>

            {/* Widget Type */}
            <FieldLabel label="Widget Type">
              <div style={{ display: "flex", gap: 8 }}>
                {(Object.keys(WIDGET_INFO) as WidgetType[]).map((wt) => (
                  <button
                    key={wt}
                    onClick={() => setWidgetType(wt)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border:
                        widgetType === wt
                          ? "1px solid #00f3ff"
                          : "1px solid #333",
                      background: widgetType === wt ? "#00f3ff15" : "#0a0a0b",
                      color: widgetType === wt ? "#00f3ff" : "#888",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {WIDGET_INFO[wt].label}
                  </button>
                ))}
              </div>
            </FieldLabel>

            <p
              style={{
                fontSize: 12,
                color: "#666",
                marginBottom: 16,
                marginTop: -8,
              }}
            >
              {WIDGET_INFO[widgetType].description}
            </p>

            {/* Type + Slug for card and badge */}
            {(widgetType === "card" || widgetType === "badge") && (
              <>
                <FieldLabel label="Entity Type">
                  <SelectInput
                    value={entityType}
                    onChange={(v) => setEntityType(v as EntityType)}
                    options={ENTITY_TYPE_OPTIONS}
                  />
                </FieldLabel>

                <FieldLabel label="Entity Slug">
                  <TextInput
                    value={slug}
                    onChange={setSlug}
                    placeholder="e.g., langchain"
                  />
                </FieldLabel>
              </>
            )}

            {/* Category for leaderboard */}
            {widgetType === "leaderboard" && (
              <>
                <FieldLabel label="Category">
                  <SelectInput
                    value={category}
                    onChange={setCategory}
                    options={CATEGORY_OPTIONS}
                  />
                </FieldLabel>

                <FieldLabel label="Entries">
                  <SelectInput
                    value={leaderboardLimit}
                    onChange={setLeaderboardLimit}
                    options={LIMIT_OPTIONS}
                  />
                </FieldLabel>
              </>
            )}

            {/* Theme */}
            <FieldLabel label="Theme">
              <div style={{ display: "flex", gap: 8 }}>
                {(["dark", "light"] as ThemeOption[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border:
                        theme === t ? "1px solid #00f3ff" : "1px solid #333",
                      background: theme === t ? "#00f3ff15" : "#0a0a0b",
                      color: theme === t ? "#00f3ff" : "#888",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </FieldLabel>

            {/* Size */}
            <FieldLabel label="Size">
              <SelectInput
                value={size}
                onChange={setSize}
                options={sizeOptions}
              />
            </FieldLabel>
          </div>

          {/* Preview Panel */}
          <div
            style={{
              background: "#111113",
              borderRadius: 12,
              border: "1px solid #222",
              padding: 24,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 20,
                color: "#fff",
              }}
            >
              Preview
            </h2>

            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: theme === "dark" ? "#050506" : "#f0f0ee",
                borderRadius: 8,
                padding: 16,
                minHeight: 300,
              }}
            >
              <iframe
                src={previewUrl}
                width={dimensions.width}
                height={dimensions.height}
                style={{ border: "none", borderRadius: 8 }}
                title="Widget Preview"
              />
            </div>
          </div>
        </div>

        {/* Embed Code */}
        <div
          style={{
            marginTop: 24,
            background: "#111113",
            borderRadius: 12,
            border: "1px solid #222",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>
              Embed Code
            </h2>
            <button
              onClick={handleCopy}
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                border: "1px solid #333",
                background: copied ? "#00f3ff20" : "#0a0a0b",
                color: copied ? "#00f3ff" : "#ccc",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              background: "#0a0a0b",
              borderRadius: 8,
              padding: 16,
              fontSize: 13,
              fontFamily: "var(--font-geist-mono), monospace",
              color: "#00f3ff",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              margin: 0,
            }}
          >
            {embedCode}
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ----- Shared form primitives ----- */

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "#888",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "8px 12px",
        borderRadius: 6,
        border: "1px solid #333",
        background: "#0a0a0b",
        color: "#e5e5e5",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "8px 12px",
        borderRadius: 6,
        border: "1px solid #333",
        background: "#0a0a0b",
        color: "#e5e5e5",
        fontSize: 13,
        boxSizing: "border-box",
      }}
    />
  );
}
