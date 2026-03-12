"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, Button } from "@aaas/ui";
import type {
  Plugin,
  PluginInstallation,
  PluginEvent,
  PluginConfigField,
} from "@/lib/plugins";

const CAPABILITY_LABELS: Record<string, string> = {
  entity_sync: "Entity Sync",
  notifications: "Notifications",
  search: "Search",
  import: "Import",
  export: "Export",
  automation: "Automation",
  analytics: "Analytics",
};

const CAPABILITY_COLORS: Record<string, string> = {
  entity_sync: "bg-circuit/10 text-circuit border border-circuit/30",
  notifications: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
  search: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
  import: "bg-green-500/10 text-green-400 border border-green-500/30",
  export: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  automation: "bg-accent-red/10 text-accent-red border border-accent-red/30",
  analytics: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-circuit/20 text-circuit",
  paused: "bg-yellow-500/20 text-yellow-400",
  error: "bg-accent-red/20 text-accent-red",
};

interface Props {
  slug: string;
}

export function IntegrationDetailClient({ slug }: Props) {
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [installation, setInstallation] = useState<PluginInstallation | null>(
    null,
  );
  const [events, setEvents] = useState<PluginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showUninstall, setShowUninstall] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [installConfig, setInstallConfig] = useState<Record<string, unknown>>(
    {},
  );
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState("");

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("aaas-user-id") || "anonymous"
      : "anonymous";

  const workspaceId =
    typeof window !== "undefined"
      ? localStorage.getItem("aaas-workspace-id") || "default"
      : "default";

  const fetchPlugin = useCallback(async () => {
    try {
      const res = await fetch(`/api/plugins/${slug}`);
      if (!res.ok) {
        setError("Integration not found");
        return;
      }
      const json = await res.json();
      setPlugin(json.data);
    } catch {
      setError("Failed to load integration");
    }
  }, [slug]);

  const fetchInstallation = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/plugins/installations?workspaceId=${workspaceId}`,
        { headers: { "x-user-id": userId } },
      );
      if (res.ok) {
        const json = await res.json();
        const installs: PluginInstallation[] = json.data || [];
        const match = installs.find(
          (i) => plugin && i.pluginId === plugin.id,
        );
        if (match) {
          setInstallation(match);
          setConfigValues(match.config || {});
        }
      }
    } catch {
      // silent
    }
  }, [userId, workspaceId, plugin]);

  const fetchEvents = useCallback(async () => {
    if (!installation) return;
    // Events would be fetched from Firestore in production.
    // For now, show placeholder data.
    setEvents([]);
  }, [installation]);

  useEffect(() => {
    fetchPlugin().finally(() => setLoading(false));
  }, [fetchPlugin]);

  useEffect(() => {
    if (plugin) fetchInstallation();
  }, [plugin, fetchInstallation]);

  useEffect(() => {
    if (installation) fetchEvents();
  }, [installation, fetchEvents]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installation) return;
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(
        `/api/plugins/installations/${installation.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({ config: configValues }),
        },
      );

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!installation) return;
    const newStatus = installation.status === "active" ? "paused" : "active";

    try {
      const res = await fetch(
        `/api/plugins/installations/${installation.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (res.ok) {
        setInstallation({ ...installation, status: newStatus });
      }
    } catch {
      // silent
    }
  };

  const handleUninstall = async () => {
    if (!installation) return;

    try {
      const res = await fetch(
        `/api/plugins/installations/${installation.id}`,
        {
          method: "DELETE",
          headers: { "x-user-id": userId },
        },
      );

      if (res.ok) {
        setInstallation(null);
        setShowUninstall(false);
        setConfigValues({});
      }
    } catch {
      // silent
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plugin) return;
    setInstalling(true);
    setInstallError("");

    try {
      const res = await fetch("/api/plugins/installations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          workspaceId,
          pluginId: plugin.id,
          config: installConfig,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setInstallError(json.error || "Failed to install");
        return;
      }

      const json = await res.json();
      setInstallation(json.data);
      setConfigValues(installConfig);
      setShowInstall(false);
      setInstallConfig({});
    } catch {
      setInstallError("Network error");
    } finally {
      setInstalling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-text-muted font-mono text-sm animate-pulse">
          Loading integration...
        </span>
      </div>
    );
  }

  if (error || !plugin) {
    return (
      <Card className="text-center py-16">
        <p className="text-text-muted mb-4">
          {error || "Integration not found"}
        </p>
        <Link href="/integrations">
          <Button variant="secondary">Back to Integrations</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="pb-16">
      {/* Back link */}
      <Link
        href="/integrations"
        className="text-sm text-text-muted hover:text-circuit font-mono mb-4 inline-block"
      >
        &larr; All Integrations
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{plugin.icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-text">{plugin.name}</h1>
            <p className="text-sm text-text-muted font-mono">
              v{plugin.version} by {plugin.author}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {installation ? (
            <>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${STATUS_COLORS[installation.status]}`}
              >
                {installation.status}
              </span>
              <Button variant="secondary" onClick={handleToggleStatus}>
                {installation.status === "active" ? "Pause" : "Resume"}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setShowInstall(true)}>
              Install
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-text-muted leading-relaxed mb-8 max-w-3xl">
        {plugin.description}
      </p>

      {/* Capabilities */}
      <Card variant="glass" className="p-5 mb-6">
        <h3 className="text-sm font-mono text-text-muted mb-3 uppercase tracking-wider">
          Capabilities
        </h3>
        <div className="flex flex-wrap gap-2">
          {plugin.capabilities.map((cap) => (
            <span
              key={cap}
              className={`text-xs font-mono px-3 py-1 rounded-full ${CAPABILITY_COLORS[cap] || "bg-surface text-text-muted border border-border"}`}
            >
              {CAPABILITY_LABELS[cap] || cap}
            </span>
          ))}
        </div>
      </Card>

      {/* Configuration (when installed) */}
      {installation && plugin.configSchema.length > 0 && (
        <Card variant="glass" className="p-5 mb-6">
          <h3 className="text-sm font-mono text-text-muted mb-4 uppercase tracking-wider">
            Configuration
          </h3>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            {plugin.configSchema.map((field) => (
              <ConfigFieldInput
                key={field.key}
                field={field}
                value={configValues[field.key]}
                onChange={(val) =>
                  setConfigValues((prev) => ({ ...prev, [field.key]: val }))
                }
              />
            ))}
            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Saving..." : "Save Configuration"}
              </Button>
              {saved && (
                <span className="text-sm text-circuit font-mono">Saved</span>
              )}
            </div>
          </form>
        </Card>
      )}

      {/* Config schema preview (when not installed) */}
      {!installation && plugin.configSchema.length > 0 && (
        <Card variant="glass" className="p-5 mb-6">
          <h3 className="text-sm font-mono text-text-muted mb-3 uppercase tracking-wider">
            Configuration Options
          </h3>
          <div className="space-y-3">
            {plugin.configSchema.map((field) => (
              <div
                key={field.key}
                className="flex items-start justify-between text-sm"
              >
                <div>
                  <span className="text-text font-medium">{field.label}</span>
                  {field.required && (
                    <span className="text-accent-red ml-1 text-xs">
                      required
                    </span>
                  )}
                  {field.description && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {field.description}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 rounded bg-surface border border-border">
                  {field.type}
                  {field.options ? ` (${field.options.length})` : ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Usage examples */}
      <Card variant="glass" className="p-5 mb-6">
        <h3 className="text-sm font-mono text-text-muted mb-3 uppercase tracking-wider">
          Usage Examples
        </h3>
        <div className="space-y-3 text-sm">
          {plugin.capabilities.includes("notifications") && (
            <div className="flex items-start gap-3">
              <span className="text-circuit font-mono text-xs mt-0.5">01</span>
              <p className="text-text-muted">
                Receive real-time notifications when new entities are added or
                existing ones change score thresholds.
              </p>
            </div>
          )}
          {plugin.capabilities.includes("entity_sync") && (
            <div className="flex items-start gap-3">
              <span className="text-circuit font-mono text-xs mt-0.5">02</span>
              <p className="text-text-muted">
                Keep your external system in sync with entity data.
                Automatically push changes when entities are created, updated,
                or deprecated.
              </p>
            </div>
          )}
          {plugin.capabilities.includes("import") && (
            <div className="flex items-start gap-3">
              <span className="text-circuit font-mono text-xs mt-0.5">03</span>
              <p className="text-text-muted">
                Import AI tools, models, and agent definitions from your
                existing data sources directly into the Knowledge Index.
              </p>
            </div>
          )}
          {plugin.capabilities.includes("export") && (
            <div className="flex items-start gap-3">
              <span className="text-circuit font-mono text-xs mt-0.5">
                {plugin.capabilities.includes("import") ? "04" : "03"}
              </span>
              <p className="text-text-muted">
                Export curated entity collections and benchmark data for
                analysis, reporting, or backup.
              </p>
            </div>
          )}
          {plugin.capabilities.includes("automation") && (
            <div className="flex items-start gap-3">
              <span className="text-circuit font-mono text-xs mt-0.5">
                {String(
                  plugin.capabilities.indexOf("automation") + 1,
                ).padStart(2, "0")}
              </span>
              <p className="text-text-muted">
                Trigger automated workflows based on entity events. Chain
                actions across multiple services.
              </p>
            </div>
          )}
          {plugin.capabilities.includes("search") && (
            <div className="flex items-start gap-3">
              <span className="text-circuit font-mono text-xs mt-0.5">
                {String(plugin.capabilities.indexOf("search") + 1).padStart(
                  2,
                  "0",
                )}
              </span>
              <p className="text-text-muted">
                Search across your connected data sources to discover AI tools
                and entities referenced in your projects.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Event log (when installed) */}
      {installation && (
        <Card variant="glass" className="p-5 mb-6">
          <h3 className="text-sm font-mono text-text-muted mb-3 uppercase tracking-wider">
            Recent Events
          </h3>
          {events.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">
              No events recorded yet. Events will appear here as the
              integration processes data.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((evt, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                >
                  <div>
                    <span className="font-mono text-circuit text-xs">
                      {evt.event}
                    </span>
                    <p className="text-xs text-text-muted">
                      {JSON.stringify(evt.payload).slice(0, 80)}
                      {JSON.stringify(evt.payload).length > 80 ? "..." : ""}
                    </p>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Uninstall (when installed) */}
      {installation && (
        <Card variant="glass" className="p-5 border-accent-red/30">
          <h3 className="text-sm font-mono text-accent-red mb-3 uppercase tracking-wider">
            Danger Zone
          </h3>
          {!showUninstall ? (
            <Button
              variant="ghost"
              onClick={() => setShowUninstall(true)}
              className="text-accent-red hover:bg-accent-red/10"
            >
              Uninstall Integration
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                This will remove the integration and all its configuration. Any
                active syncs will stop immediately.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleUninstall}
                  className="text-accent-red hover:bg-accent-red/10"
                >
                  Confirm Uninstall
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowUninstall(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Install modal */}
      {showInstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInstall(false)}
          />
          <Card
            variant="glass"
            className="relative z-10 w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{plugin.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-text">
                  Install {plugin.name}
                </h2>
                <p className="text-sm text-text-muted font-mono">
                  v{plugin.version}
                </p>
              </div>
            </div>

            <form onSubmit={handleInstall} className="space-y-4">
              {plugin.configSchema.map((field) => (
                <ConfigFieldInput
                  key={field.key}
                  field={field}
                  value={installConfig[field.key]}
                  onChange={(val) =>
                    setInstallConfig((prev) => ({
                      ...prev,
                      [field.key]: val,
                    }))
                  }
                />
              ))}

              {installError && (
                <p className="text-sm text-accent-red font-mono">
                  {installError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowInstall(false)}
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
