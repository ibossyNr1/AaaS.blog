"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Badge, Button, cn } from "@aaas/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Variant {
  id: string;
  name: string;
  description: string;
  weight: number;
  config: Record<string, unknown>;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "paused" | "completed";
  variants: Variant[];
  trafficAllocation: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  targetAudience?: string;
}

interface ExperimentResult {
  experimentId: string;
  variantId: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
}

type StatusFilter = "all" | "draft" | "running" | "paused" | "completed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-text-muted/20 text-text-muted",
  running: "bg-green-500/20 text-green-400",
  paused: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-circuit/20 text-circuit",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExperimentsClient() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [detailExperiment, setDetailExperiment] = useState<Experiment | null>(
    null,
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTraffic, setFormTraffic] = useState(100);
  const [formAudience, setFormAudience] = useState("");
  const [formVariants, setFormVariants] = useState<
    { name: string; description: string; weight: number }[]
  >([
    { name: "Control", description: "Default experience", weight: 50 },
    { name: "Treatment A", description: "Variant A", weight: 50 },
  ]);
  const [creating, setCreating] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch experiments
  // -------------------------------------------------------------------------

  const fetchExperiments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/experiments?status=${statusFilter}`);
      if (res.ok) {
        const { data } = await res.json();
        setExperiments(data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  // -------------------------------------------------------------------------
  // Fetch experiment detail with results
  // -------------------------------------------------------------------------

  const fetchDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/experiments/${id}`);
      if (res.ok) {
        const { data } = await res.json();
        setDetailExperiment(data.experiment);
        setResults(data.results ?? []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  // -------------------------------------------------------------------------
  // Create experiment
  // -------------------------------------------------------------------------

  const handleCreate = async () => {
    if (!formName.trim() || formVariants.length < 2) return;
    setCreating(true);

    try {
      const variants: Variant[] = formVariants.map((v, i) => ({
        id: `v${i}`,
        name: v.name,
        description: v.description,
        weight: v.weight,
        config: {},
      }));

      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-uid": "admin",
        },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          variants,
          trafficAllocation: formTraffic,
          targetAudience: formAudience || undefined,
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setFormName("");
        setFormDesc("");
        setFormTraffic(100);
        setFormAudience("");
        setFormVariants([
          { name: "Control", description: "Default experience", weight: 50 },
          { name: "Treatment A", description: "Variant A", weight: 50 },
        ]);
        fetchExperiments();
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  // -------------------------------------------------------------------------
  // Status transitions
  // -------------------------------------------------------------------------

  const updateStatus = async (
    id: string,
    status: "running" | "paused" | "completed",
  ) => {
    try {
      await fetch(`/api/experiments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-uid": "admin",
        },
        body: JSON.stringify({ status }),
      });
      fetchExperiments();
      if (selectedId === id) fetchDetail(id);
    } catch {
      // silent
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (selectedId && detailExperiment) {
    return (
      <ExperimentDetail
        experiment={detailExperiment}
        results={results}
        onBack={() => {
          setSelectedId(null);
          setDetailExperiment(null);
          setResults([]);
        }}
        onUpdateStatus={updateStatus}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {(["all", "draft", "running", "paused", "completed"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  statusFilter === s
                    ? "bg-circuit/20 text-circuit"
                    : "text-text-muted hover:text-text hover:bg-surface-alt/50",
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ),
          )}
        </div>
        <div className="ml-auto">
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Cancel" : "New Experiment"}
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card variant="glass" className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text">
            Create Experiment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-1">
                Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-circuit"
                placeholder="e.g. Homepage CTA Color"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">
                Traffic Allocation (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={formTraffic}
                onChange={(e) => setFormTraffic(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-circuit"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-text-muted mb-1">
                Description
              </label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-circuit resize-none"
                placeholder="What are you testing?"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-text-muted mb-1">
                Target Audience (optional)
              </label>
              <input
                type="text"
                value={formAudience}
                onChange={(e) => setFormAudience(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-circuit"
                placeholder="e.g. new_users, developer persona"
              />
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text">Variants</label>
              <button
                onClick={() =>
                  setFormVariants([
                    ...formVariants,
                    {
                      name: `Treatment ${String.fromCharCode(65 + formVariants.length - 1)}`,
                      description: "",
                      weight: 50,
                    },
                  ])
                }
                className="text-xs text-circuit hover:underline"
              >
                + Add variant
              </button>
            </div>
            <div className="space-y-2">
              {formVariants.map((v, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => {
                      const copy = [...formVariants];
                      copy[i] = { ...copy[i], name: e.target.value };
                      setFormVariants(copy);
                    }}
                    className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-circuit"
                    placeholder="Variant name"
                  />
                  <input
                    type="text"
                    value={v.description}
                    onChange={(e) => {
                      const copy = [...formVariants];
                      copy[i] = { ...copy[i], description: e.target.value };
                      setFormVariants(copy);
                    }}
                    className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-circuit"
                    placeholder="Description"
                  />
                  <input
                    type="number"
                    min={1}
                    value={v.weight}
                    onChange={(e) => {
                      const copy = [...formVariants];
                      copy[i] = { ...copy[i], weight: Number(e.target.value) };
                      setFormVariants(copy);
                    }}
                    className="w-20 bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-circuit"
                    placeholder="Weight"
                  />
                  {formVariants.length > 2 && (
                    <button
                      onClick={() =>
                        setFormVariants(formVariants.filter((_, j) => j !== i))
                      }
                      className="text-red-400 hover:text-red-300 text-sm px-2 py-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={creating || !formName.trim()}
            >
              {creating ? "Creating..." : "Create Experiment"}
            </Button>
          </div>
        </Card>
      )}

      {/* Experiment List */}
      {loading ? (
        <div className="text-center text-text-muted py-12">
          Loading experiments...
        </div>
      ) : experiments.length === 0 ? (
        <Card variant="glass" className="p-12 text-center">
          <p className="text-text-muted">
            No experiments found. Create your first A/B test to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {experiments.map((exp) => (
            <Card
              key={exp.id}
              variant="glass"
              className="p-5 cursor-pointer hover:border-circuit/40 transition-colors"
              onClick={() => setSelectedId(exp.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-text truncate">
                      {exp.name}
                    </h3>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        STATUS_COLORS[exp.status] ?? STATUS_COLORS.draft,
                      )}
                    >
                      {exp.status}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-text-muted line-clamp-1">
                      {exp.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                    <span>{exp.variants.length} variants</span>
                    <span>{exp.trafficAllocation}% traffic</span>
                    <span>Created {formatDate(exp.createdAt)}</span>
                    {exp.targetAudience && (
                      <Badge variant="circuit">{exp.targetAudience}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {exp.status === "draft" && (
                    <Button
                      variant="primary"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        updateStatus(exp.id, "running");
                      }}
                    >
                      Start
                    </Button>
                  )}
                  {exp.status === "running" && (
                    <Button
                      variant="secondary"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        updateStatus(exp.id, "paused");
                      }}
                    >
                      Pause
                    </Button>
                  )}
                  {exp.status === "paused" && (
                    <Button
                      variant="primary"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        updateStatus(exp.id, "running");
                      }}
                    >
                      Resume
                    </Button>
                  )}
                  {(exp.status === "running" || exp.status === "paused") && (
                    <Button
                      variant="secondary"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        updateStatus(exp.id, "completed");
                      }}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Experiment Detail sub-component
// ---------------------------------------------------------------------------

function ExperimentDetail({
  experiment,
  results,
  onBack,
  onUpdateStatus,
}: {
  experiment: Experiment;
  results: ExperimentResult[];
  onBack: () => void;
  onUpdateStatus: (id: string, status: "running" | "paused" | "completed") => void;
}) {
  const maxImpressions = Math.max(...results.map((r) => r.impressions), 1);

  return (
    <div className="space-y-8">
      {/* Back button + header */}
      <div>
        <button
          onClick={onBack}
          className="text-sm text-circuit hover:underline mb-4 inline-block"
        >
          &larr; Back to experiments
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-text">
                {experiment.name}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  STATUS_COLORS[experiment.status] ?? STATUS_COLORS.draft,
                )}
              >
                {experiment.status}
              </span>
            </div>
            {experiment.description && (
              <p className="text-text-muted">{experiment.description}</p>
            )}
            <div className="flex gap-4 mt-2 text-sm text-text-muted">
              <span>{experiment.trafficAllocation}% traffic</span>
              {experiment.startedAt && (
                <span>Started {formatDate(experiment.startedAt)}</span>
              )}
              {experiment.endedAt && (
                <span>Ended {formatDate(experiment.endedAt)}</span>
              )}
              {experiment.targetAudience && (
                <Badge variant="circuit">{experiment.targetAudience}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {experiment.status === "draft" && (
              <Button
                variant="primary"
                onClick={() => onUpdateStatus(experiment.id, "running")}
              >
                Start
              </Button>
            )}
            {experiment.status === "running" && (
              <Button
                variant="secondary"
                onClick={() => onUpdateStatus(experiment.id, "paused")}
              >
                Pause
              </Button>
            )}
            {experiment.status === "paused" && (
              <Button
                variant="primary"
                onClick={() => onUpdateStatus(experiment.id, "running")}
              >
                Resume
              </Button>
            )}
            {(experiment.status === "running" ||
              experiment.status === "paused") && (
              <Button
                variant="secondary"
                onClick={() => onUpdateStatus(experiment.id, "completed")}
              >
                Complete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Variant breakdown */}
      <Card variant="glass" className="p-6">
        <h3 className="text-lg font-semibold text-text mb-4">
          Variant Breakdown
        </h3>
        <div className="space-y-1 mb-4">
          <div className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-2 text-xs font-medium text-text-muted uppercase tracking-wider pb-2 border-b border-border">
            <span>Variant</span>
            <span className="text-right">Impressions</span>
            <span className="text-right">Conversions</span>
            <span className="text-right">CVR</span>
            <span className="text-right">Confidence</span>
          </div>
          {experiment.variants.map((v) => {
            const result = results.find((r) => r.variantId === v.id);
            return (
              <div
                key={v.id}
                className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-2 items-center py-3 border-b border-border/50 last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-text">
                    {v.name}
                  </span>
                  {v.description && (
                    <span className="text-xs text-text-muted ml-2">
                      {v.description}
                    </span>
                  )}
                  <span className="text-xs text-text-muted ml-2">
                    (weight: {v.weight})
                  </span>
                </div>
                <span className="text-sm text-text text-right tabular-nums">
                  {result?.impressions.toLocaleString() ?? 0}
                </span>
                <span className="text-sm text-text text-right tabular-nums">
                  {result?.conversions.toLocaleString() ?? 0}
                </span>
                <span className="text-sm text-circuit text-right tabular-nums font-medium">
                  {result ? pct(result.conversionRate) : "0.0%"}
                </span>
                <span
                  className={cn(
                    "text-sm text-right tabular-nums font-medium",
                    result && result.confidence >= 0.95
                      ? "text-green-400"
                      : result && result.confidence >= 0.8
                        ? "text-yellow-400"
                        : "text-text-muted",
                  )}
                >
                  {result ? pct(result.confidence) : "--"}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bar chart */}
      {results.length > 0 && (
        <Card variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-text mb-4">
            Impressions Comparison
          </h3>
          <div className="space-y-3">
            {results.map((r) => {
              const variant = experiment.variants.find(
                (v) => v.id === r.variantId,
              );
              const barWidth = (r.impressions / maxImpressions) * 100;
              return (
                <div key={r.variantId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text font-medium">
                      {variant?.name ?? r.variantId}
                    </span>
                    <span className="text-text-muted tabular-nums">
                      {r.impressions.toLocaleString()} impressions / CVR{" "}
                      {pct(r.conversionRate)}
                    </span>
                  </div>
                  <div className="h-6 bg-surface rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-circuit/40 rounded-lg transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Conversion Rate Comparison */}
      {results.length > 0 && (
        <Card variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-text mb-4">
            Conversion Rate Comparison
          </h3>
          <div className="space-y-3">
            {results.map((r) => {
              const variant = experiment.variants.find(
                (v) => v.id === r.variantId,
              );
              const barWidth = Math.max(r.conversionRate * 100, 0);
              return (
                <div key={r.variantId}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text font-medium">
                      {variant?.name ?? r.variantId}
                    </span>
                    <span className="text-text-muted tabular-nums">
                      {pct(r.conversionRate)}
                    </span>
                  </div>
                  <div className="h-6 bg-surface rounded-lg overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-lg transition-all duration-500",
                        r.confidence >= 0.95
                          ? "bg-green-500/50"
                          : r.confidence >= 0.8
                            ? "bg-yellow-500/50"
                            : "bg-circuit/30",
                      )}
                      style={{ width: `${Math.min(barWidth, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
