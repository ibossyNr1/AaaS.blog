"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, Button } from "@aaas/ui";
import type { Plugin, PluginInstallation, PluginCategory, PluginConfigField } from "@/lib/plugins";

const CATEGORY_LABELS: Record<"all" | PluginCategory, string> = {
  all: "All",
  communication: "Communication",
  development: "Development",
  analytics: "Analytics",
  automation: "Automation",
  storage: "Storage",
};

const CATEGORY_COLORS: Record<PluginCategory, string> = {
  communication: "bg-circuit/10 text-circuit border border-circuit/30",
  development: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
  analytics: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  automation: "bg-accent-red/10 text-accent-red border border-accent-red/30",
  storage: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
};

const CAPABILITY_LABELS: Record<string, string> = {
  entity_sync: "Entity Sync",
  notifications: "Notifications",
  search: "Search",
  import: "Import",
  export: "Export",
  automation: "Automation",
  analytics: "Analytics",
};

export function IntegrationsClient() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installations, setInstallations] = useState<PluginInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"all" | PluginCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [installModal, setInstallModal] = useState<Plugin | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({});
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState("");

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("aaas-user-id") || "anonymous"
      : "anonymous";

  const workspaceId =
    typeof window !== "undefined"
      ? localStorage.getItem("aaas-workspace-id") || "default"
      : "default";

  const fetchPlugins = useCallback(async () => {
    try {
      const res = await fetch("/api/plugins");
      if (res.ok) {
        const json = await res.json();
        setPlugins(json.data || []);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchInstallations = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/plugins/installations?workspaceId=${workspaceId}`,
        { headers: { "x-user-id": userId } },
      );
      if (res.ok) {
        const json = await res.json();
        setInstallations(json.data || []);
      }
    } catch {
      // silent
    }
  }, [userId, workspaceId]);

  useEffect(() => {
    Promise.all([fetchPlugins(), fetchInstallations()]).finally(() =>
      setLoading(false),
    );
  }, [fetchPlugins, fetchInstallations]);

  const isInstalled = (pluginId: string) =>
    installations.some((i) => i.pluginId === pluginId);

  const getInstallation = (pluginId: string) =>
    installations.find((i) => i.pluginId === pluginId);

  const openInstallModal = (plugin: Plugin) => {
    setInstallModal(plugin);
    setConfigValues({});
    setError("");
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installModal) return;
    setInstalling(true);
    setError("");

    try {
      const res = await fetch("/api/plugins/installations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          workspaceId,
          pluginId: installModal.id,
          config: configValues,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to install plugin");
        return;
      }

      setInstallModal(null);
      fetchInstallations();
    } catch {
      setError("Network error");
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async (installationId: string) => {
    if (!confirm("Uninstall this integration? This will remove all configuration.")) return;

    try {
      await fetch(`/api/plugins/installations/${installationId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
      fetchInstallations();
    } catch {
      // silent
    }
  };

  const filteredPlugins = plugins.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const installedPlugins = plugins.filter((p) => isInstalled(p.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-text-muted font-mono text-sm animate-pulse">
          Loading integrations...
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Installed plugins section */}
      {installedPlugins.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
            Installed ({installedPlugins.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {installedPlugins.map((plugin) => {
              const installation = getInstallation(plugin.id);
              return (
                <Card
                  key={plugin.id}
                  variant="glass"
                  className="p-5 border-circuit/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{plugin.icon}</span>
                      <div>
                        <Link
                          href={`/integrations/${plugin.slug}`}
                          className="text-base font-semibold text-text hover:text-circuit transition-colors"
                        >
                          {plugin.name}
                        </Link>
                        <p className="text-xs text-text-muted font-mono">
                          v{plugin.version}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-circuit/20 text-circuit">
                        {installation?.status || "active"}
                      </span>
                      <button
                        onClick={() =>
                          installation && handleUninstall(installation.id)
                        }
                        className="text-xs text-text-muted hover:text-accent-red transition-colors font-mono"
                      >
                        Uninstall
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-text-muted line-clamp-2">
                    {plugin.description}
                  </p>
                  {installation?.lastSync && (
                    <p className="text-[10px] text-text-muted font-mono mt-2">
                      Last sync:{" "}
                      {new Date(installation.lastSync).toLocaleString()}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search integrations..."
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit mb-4"
        />

        <div className="flex gap-1 border-b border-border">
          {(Object.keys(CATEGORY_LABELS) as Array<"all" | PluginCategory>).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2.5 text-sm font-mono transition-colors relative ${
                  activeCategory === cat
                    ? "text-circuit"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {CATEGORY_LABELS[cat]}
                {activeCategory === cat && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-circuit" />
                )}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Plugin grid */}
      {filteredPlugins.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-text-muted">
            No integrations found
            {searchQuery ? ` for "${searchQuery}"` : ""}.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlugins.map((plugin) => {
            const installed = isInstalled(plugin.id);
            return (
              <Card
                key={plugin.id}
                variant="glass"
                className="p-5 hover:border-circuit/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{plugin.icon}</span>
                    <div>
                      <Link
                        href={`/integrations/${plugin.slug}`}
                        className="text-base font-semibold text-text hover:text-circuit transition-colors"
                      >
                        {plugin.name}
                      </Link>
                      <p className="text-xs text-text-muted font-mono">
                        by {plugin.author}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${CATEGORY_COLORS[plugin.category]}`}
                  >
                    {plugin.category}
                  </span>
                </div>

                <p className="text-sm text-text-muted line-clamp-2 mb-4">
                  {plugin.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {plugin.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface text-text-muted border border-border"
                    >
                      {CAPABILITY_LABELS[cap] || cap}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-mono">
                    v{plugin.version}
                  </span>
                  {installed ? (
                    <Link href={`/integrations/${plugin.slug}`}>
                      <Button variant="secondary">Configure</Button>
                    </Link>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => openInstallModal(plugin)}
                    >
                      Install
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Install modal */}
      {installModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setInstallModal(null)}
          />
          <Card
            variant="glass"
            className="relative z-10 w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{installModal.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-text">
                  Install {installModal.name}
                </h2>
                <p className="text-sm text-text-muted font-mono">
                  v{installModal.version} by {installModal.author}
                </p>
              </div>
            </div>

            <form onSubmit={handleInstall} className="space-y-4">
              {installModal.configSchema.map((field) => (
                <ConfigFieldInput
                  key={field.key}
                  field={field}
                  value={configValues[field.key]}
                  onChange={(val) =>
                    setConfigValues((prev) => ({ ...prev, [field.key]: val }))
                  }
                />
              ))}

              {error && (
                <p className="text-sm text-accent-red font-mono">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setInstallModal(null)}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={installing}>
                  {installing ? "Installing..." : "Install"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Config Field Input ─────────────────────────────────────────────────

function ConfigFieldInput({
  field,
  value,
  onChange,
}: {
  field: PluginConfigField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-border"
        />
        <span>{field.label}</span>
        {field.description && (
          <span className="text-text-muted text-xs">— {field.description}</span>
        )}
      </label>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <div>
        <label className="block text-sm font-mono text-text-muted mb-1">
          {field.label}
          {field.required && <span className="text-accent-red ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-xs text-text-muted mb-1.5">{field.description}</p>
        )}
        <select
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit"
        >
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div>
        <label className="block text-sm font-mono text-text-muted mb-1">
          {field.label}
          {field.required && <span className="text-accent-red ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-xs text-text-muted mb-1.5">{field.description}</p>
        )}
        <input
          type="number"
          value={(value as number) || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          required={field.required}
          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit font-mono"
        />
      </div>
    );
  }

  // Default: string
  return (
    <div>
      <label className="block text-sm font-mono text-text-muted mb-1">
        {field.label}
        {field.required && <span className="text-accent-red ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-text-muted mb-1.5">{field.description}</p>
      )}
      <input
        type="text"
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        placeholder={field.label}
        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit font-mono"
      />
    </div>
  );
}
