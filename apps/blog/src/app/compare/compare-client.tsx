"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, cn } from "@aaas/ui";
import type { Entity, EntityType } from "@/lib/types";
import { ENTITY_TYPES } from "@/lib/types";
import { ComparisonExport } from "@/components/comparison-export";
import { PrintButton } from "@/components/print-button";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const SCORE_KEYS: { key: keyof Entity["scores"]; label: string }[] = [
  { key: "composite", label: "Composite" },
  { key: "adoption", label: "Adoption" },
  { key: "quality", label: "Quality" },
  { key: "freshness", label: "Freshness" },
  { key: "citations", label: "Citations" },
  { key: "engagement", label: "Engagement" },
];

const FIELD_KEYS: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "provider", label: "Provider" },
  { key: "version", label: "Version" },
  { key: "category", label: "Category" },
  { key: "pricingModel", label: "Pricing" },
  { key: "license", label: "License" },
];

const ARRAY_FIELD_KEYS: { key: string; label: string }[] = [
  { key: "capabilities", label: "Capabilities" },
  { key: "integrations", label: "Integrations" },
  { key: "tags", label: "Tags" },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function entityKey(e: Entity): string {
  return `${e.type}/${e.slug}`;
}

function groupByType(entities: Entity[]): { type: EntityType; label: string; items: Entity[] }[] {
  const groups: Partial<Record<EntityType, Entity[]>> = {};
  for (const e of entities) {
    (groups[e.type] ??= []).push(e);
  }
  return (Object.keys(ENTITY_TYPES) as EntityType[])
    .filter((t) => groups[t]?.length)
    .map((t) => ({ type: t, label: ENTITY_TYPES[t].plural, items: groups[t]! }));
}

function getField(entity: Entity, key: string): string {
  const val = (entity as unknown as Record<string, unknown>)[key];
  if (val == null) return "—";
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
}

function getArrayField(entity: Entity, key: string): string[] {
  const val = (entity as unknown as Record<string, unknown>)[key];
  if (!Array.isArray(val)) return [];
  return val as string[];
}

/* -------------------------------------------------------------------------- */
/*  EntitySelector                                                             */
/* -------------------------------------------------------------------------- */

function EntitySelector({
  label,
  value,
  onChange,
  groups,
}: {
  label: string;
  value: string;
  onChange: (key: string) => void;
  groups: { type: EntityType; label: string; items: Entity[] }[];
}) {
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2.5 rounded border border-border bg-surface text-sm text-text",
          "focus:outline-none focus:border-circuit transition-colors",
          "appearance-none cursor-pointer",
        )}
      >
        <option value="">Select an entity...</option>
        {groups.map((g) => (
          <optgroup key={g.type} label={g.label}>
            {g.items.map((e) => (
              <option key={entityKey(e)} value={entityKey(e)}>
                {e.name} — {e.provider}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ScoreComparisonBar                                                         */
/* -------------------------------------------------------------------------- */

function ScoreComparisonBar({
  label,
  valueA,
  valueB,
}: {
  label: string;
  valueA: number;
  valueB: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-circuit">{valueA}</span>
          <span className="text-text-muted">/</span>
          <span className="text-accent-red">{valueB}</span>
        </div>
      </div>
      <div className="flex gap-1 h-2">
        {/* Entity A bar */}
        <div className="flex-1 bg-surface rounded-l overflow-hidden flex justify-end">
          <div
            className="h-full bg-circuit rounded-l transition-all duration-700"
            style={{ width: `${(valueA / 100) * 100}%` }}
          />
        </div>
        {/* Entity B bar */}
        <div className="flex-1 bg-surface rounded-r overflow-hidden">
          <div
            className="h-full bg-accent-red rounded-r transition-all duration-700"
            style={{ width: `${(valueB / 100) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  VennList — capabilities/integrations overlap                               */
/* -------------------------------------------------------------------------- */

function VennList({
  label,
  listA,
  listB,
  nameA,
  nameB,
}: {
  label: string;
  listA: string[];
  listB: string[];
  nameA: string;
  nameB: string;
}) {
  const setA = new Set(listA);
  const setB = new Set(listB);
  const both = listA.filter((x) => setB.has(x));
  const onlyA = listA.filter((x) => !setB.has(x));
  const onlyB = listB.filter((x) => !setA.has(x));

  if (onlyA.length === 0 && both.length === 0 && onlyB.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">{label}</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Only A */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-circuit mb-2">
            Only {nameA}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {onlyA.length > 0 ? (
              onlyA.map((item) => (
                <span
                  key={item}
                  className="text-[10px] font-mono bg-circuit/10 text-circuit px-2 py-0.5 rounded"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-text-muted italic">None</span>
            )}
          </div>
        </div>

        {/* Both */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
            Shared
          </p>
          <div className="flex flex-wrap gap-1.5">
            {both.length > 0 ? (
              both.map((item) => (
                <span
                  key={item}
                  className="text-[10px] font-mono bg-surface text-text px-2 py-0.5 rounded border border-border"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-text-muted italic">None</span>
            )}
          </div>
        </div>

        {/* Only B */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-accent-red mb-2">
            Only {nameB}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {onlyB.length > 0 ? (
              onlyB.map((item) => (
                <span
                  key={item}
                  className="text-[10px] font-mono bg-accent-red/10 text-accent-red px-2 py-0.5 rounded"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-text-muted italic">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main CompareClient                                                         */
/* -------------------------------------------------------------------------- */

export function CompareClient({ entities }: { entities: Entity[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const groups = useMemo(() => groupByType(entities), [entities]);
  const entityMap = useMemo(() => {
    const map = new Map<string, Entity>();
    for (const e of entities) {
      map.set(entityKey(e), e);
    }
    return map;
  }, [entities]);

  /* Parse ?e= param for shareable links (e.g., ?e=tool:langchain,model:gpt-5) */
  const eParam = searchParams.get("e");
  const parsedFromE = useMemo(() => {
    if (!eParam) return null;
    const parts = eParam.split(",").map((p) => {
      const [type, slug] = p.split(":");
      return slug ? `${type}/${slug}` : "";
    }).filter(Boolean);
    return parts.length >= 2 ? { a: parts[0], b: parts[1] } : null;
  }, [eParam]);

  const [keyA, setKeyA] = useState<string>(
    parsedFromE?.a ?? searchParams.get("a") ?? "",
  );
  const [keyB, setKeyB] = useState<string>(
    parsedFromE?.b ?? searchParams.get("b") ?? "",
  );

  /* Sync from ?e= param on mount / param change */
  useEffect(() => {
    if (parsedFromE) {
      if (entityMap.has(parsedFromE.a)) setKeyA(parsedFromE.a);
      if (entityMap.has(parsedFromE.b)) setKeyB(parsedFromE.b);
    }
  }, [parsedFromE, entityMap]);

  const entityA = keyA ? entityMap.get(keyA) ?? null : null;
  const entityB = keyB ? entityMap.get(keyB) ?? null : null;

  const updateParams = useCallback(
    (a: string, b: string) => {
      const params = new URLSearchParams();
      if (a) params.set("a", a);
      if (b) params.set("b", b);
      const qs = params.toString();
      router.replace(`/compare${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  const handleA = useCallback(
    (val: string) => {
      setKeyA(val);
      updateParams(val, keyB);
    },
    [keyB, updateParams],
  );

  const handleB = useCallback(
    (val: string) => {
      setKeyB(val);
      updateParams(keyA, val);
    },
    [keyA, updateParams],
  );

  const handleSwap = useCallback(() => {
    setKeyA(keyB);
    setKeyB(keyA);
    updateParams(keyB, keyA);
  }, [keyA, keyB, updateParams]);

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="space-y-8">
      {/* ---- Selection Row ---- */}
      <Card className="!p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
          <EntitySelector label="Entity A" value={keyA} onChange={handleA} groups={groups} />

          <button
            onClick={handleSwap}
            className={cn(
              "self-center md:self-end shrink-0 w-10 h-10 flex items-center justify-center",
              "rounded border border-border text-text-muted hover:text-circuit hover:border-circuit",
              "transition-colors text-sm font-mono",
            )}
            title="Swap entities"
          >
            &#8646;
          </button>

          <EntitySelector label="Entity B" value={keyB} onChange={handleB} groups={groups} />
        </div>
      </Card>

      {/* ---- Comparison (only when both selected) ---- */}
      {entityA && entityB && (
        <>
          {/* ---- Score Comparison ---- */}
          <Card>
            <h3 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-1">
              Score Comparison
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs font-mono text-circuit">{entityA.name}</span>
              <span className="text-[10px] text-text-muted">vs</span>
              <span className="text-xs font-mono text-accent-red">{entityB.name}</span>
            </div>
            <div className="space-y-3">
              {SCORE_KEYS.map(({ key, label }) => (
                <ScoreComparisonBar
                  key={key}
                  label={label}
                  valueA={entityA.scores[key]}
                  valueB={entityB.scores[key]}
                />
              ))}
            </div>
          </Card>

          {/* ---- Field Comparison Table ---- */}
          <Card className="!p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface/30">
              <h3 className="text-sm font-mono uppercase tracking-wider text-text-muted">
                Field Comparison
              </h3>
            </div>
            <div className="divide-y divide-border">
              {/* Header row */}
              <div className="grid grid-cols-3 px-4 py-2 bg-surface/20">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  Field
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-circuit">
                  {entityA.name}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent-red">
                  {entityB.name}
                </span>
              </div>

              {/* Scalar fields */}
              {FIELD_KEYS.map(({ key, label }) => {
                const valA = getField(entityA, key);
                const valB = getField(entityB, key);
                const differs = valA !== valB;
                return (
                  <div
                    key={key}
                    className={cn(
                      "grid grid-cols-3 px-4 py-2.5 text-sm",
                      differs && "bg-circuit/5",
                    )}
                  >
                    <span className="text-xs font-mono text-text-muted">{label}</span>
                    <span className="text-xs text-text break-words">{valA}</span>
                    <span className="text-xs text-text break-words">{valB}</span>
                  </div>
                );
              })}

              {/* Array fields */}
              {ARRAY_FIELD_KEYS.map(({ key, label }) => {
                const valA = getArrayField(entityA, key).join(", ") || "—";
                const valB = getArrayField(entityB, key).join(", ") || "—";
                const differs = valA !== valB;
                return (
                  <div
                    key={key}
                    className={cn(
                      "grid grid-cols-3 px-4 py-2.5 text-sm",
                      differs && "bg-circuit/5",
                    )}
                  >
                    <span className="text-xs font-mono text-text-muted">{label}</span>
                    <span className="text-xs text-text break-words">{valA}</span>
                    <span className="text-xs text-text break-words">{valB}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ---- Capabilities & Integrations Overlap ---- */}
          <Card>
            <div className="space-y-6">
              <VennList
                label="Capabilities"
                listA={entityA.capabilities}
                listB={entityB.capabilities}
                nameA={entityA.name}
                nameB={entityB.name}
              />
              <VennList
                label="Integrations"
                listA={entityA.integrations}
                listB={entityB.integrations}
                nameA={entityA.name}
                nameB={entityB.name}
              />
            </div>
          </Card>

          {/* ---- Export & Print ---- */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ComparisonExport entities={[entityA, entityB]} />
            </div>
            <PrintButton />
          </div>
        </>
      )}

      {/* ---- Empty state ---- */}
      {(!entityA || !entityB) && (
        <div className="text-center py-16 text-text-muted text-sm">
          Select two entities above to see a side-by-side comparison.
        </div>
      )}
    </div>
  );
}
