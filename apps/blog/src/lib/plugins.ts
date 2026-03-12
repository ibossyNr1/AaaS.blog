/**
 * Plugin System Core
 *
 * Defines the plugin/integration architecture for the AaaS Knowledge Index.
 * Plugins are data/config only — no actual third-party API calls.
 * Installations and events are stored in Firestore.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Types ──────────────────────────────────────────────────────────────

export type PluginCategory =
  | "communication"
  | "development"
  | "analytics"
  | "automation"
  | "storage";

export type PluginCapability =
  | "entity_sync"
  | "notifications"
  | "search"
  | "import"
  | "export"
  | "automation"
  | "analytics";

export interface PluginConfigField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "select";
  required: boolean;
  options?: string[];
  description?: string;
}

export interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: PluginCategory;
  version: string;
  author: string;
  status: "active" | "inactive" | "deprecated";
  capabilities: PluginCapability[];
  configSchema: PluginConfigField[];
  webhookUrl?: string;
  createdAt: string;
}

export interface PluginInstallation {
  id: string;
  pluginId: string;
  workspaceId: string;
  userId: string;
  config: Record<string, unknown>;
  status: "active" | "paused" | "error";
  installedAt: string;
  lastSync?: string;
}

export interface PluginEvent {
  pluginId: string;
  installationId: string;
  event: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

// ── Built-in Plugins ───────────────────────────────────────────────────

const BUILT_IN_PLUGINS: Plugin[] = [
  {
    id: "slack",
    name: "Slack",
    slug: "slack",
    description:
      "Send notifications and entity alerts to Slack channels. Get real-time updates when entities change, new benchmarks drop, or agents complete runs.",
    icon: "💬",
    category: "communication",
    version: "1.0.0",
    author: "AaaS",
    status: "active",
    capabilities: ["notifications", "entity_sync"],
    configSchema: [
      {
        key: "webhook_url",
        label: "Webhook URL",
        type: "string",
        required: true,
        description: "Slack incoming webhook URL for your channel",
      },
      {
        key: "channel",
        label: "Channel",
        type: "string",
        required: false,
        description: "Override default channel (e.g. #ai-updates)",
      },
      {
        key: "notify_new_entities",
        label: "Notify on new entities",
        type: "boolean",
        required: false,
        description: "Send alert when new entities are added",
      },
      {
        key: "notify_score_changes",
        label: "Notify on score changes",
        type: "boolean",
        required: false,
        description: "Send alert when entity scores change significantly",
      },
    ],
    createdAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "discord",
    name: "Discord",
    slug: "discord",
    description:
      "Post entity alerts and notifications to Discord servers. Keep your community informed about AI ecosystem changes.",
    icon: "🎮",
    category: "communication",
    version: "1.0.0",
    author: "AaaS",
    status: "active",
    capabilities: ["notifications", "entity_sync"],
    configSchema: [
      {
        key: "webhook_url",
        label: "Webhook URL",
        type: "string",
        required: true,
        description: "Discord webhook URL for your server channel",
      },
      {
        key: "mention_role",
        label: "Mention Role",
        type: "string",
        required: false,
        description: "Role ID to mention on critical alerts",
      },
      {
        key: "embed_style",
        label: "Embed Style",
        type: "select",
        required: false,
        options: ["compact", "detailed", "minimal"],
        description: "How entity cards appear in Discord",
      },
    ],
    createdAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "github",
    name: "GitHub",
    slug: "github",
    description:
      "Sync entities from GitHub repositories. Automatically detect tools, models, and agents mentioned in PRs and issues.",
    icon: "🐙",
    category: "development",
    version: "1.0.0",
    author: "AaaS",
    status: "active",
    capabilities: ["entity_sync", "import", "search"],
    configSchema: [
      {
        key: "access_token",
        label: "Access Token",
        type: "string",
        required: true,
        description: "GitHub personal access token with repo scope",
      },
      {
        key: "repositories",
        label: "Repositories",
        type: "string",
        required: false,
        description: "Comma-separated list of owner/repo to monitor",
      },
      {
        key: "sync_interval",
        label: "Sync Interval (minutes)",
        type: "number",
        required: false,
        description: "How often to check for changes (default: 60)",
      },
      {
        key: "auto_create_entities",
        label: "Auto-create entities",
        type: "boolean",
        required: false,
        description: "Automatically create entities from detected AI tools",
      },
    ],
    createdAt: "2026-01-20T00:00:00.000Z",
  },
  {
    id: "zapier",
    name: "Zapier",
    slug: "zapier",
    description:
      "Connect AaaS to 5000+ apps through Zapier. Trigger automations when entities change or use Zaps to import data.",
    icon: "⚡",
    category: "automation",
    version: "1.0.0",
    author: "AaaS",
    status: "active",
    capabilities: ["automation", "import", "export"],
    configSchema: [
      {
        key: "api_key",
        label: "Zapier API Key",
        type: "string",
        required: true,
        description: "Your Zapier webhook API key",
      },
      {
        key: "trigger_url",
        label: "Trigger Webhook URL",
        type: "string",
        required: false,
        description: "Zapier catch hook URL for inbound triggers",
      },
      {
        key: "enabled_triggers",
        label: "Enabled Triggers",
        type: "select",
        required: false,
        options: [
          "entity_created",
          "entity_updated",
          "score_changed",
          "all",
        ],
        description: "Which events trigger Zapier automations",
      },
    ],
    createdAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    slug: "google-sheets",
    description:
      "Export entity data to Google Sheets or import entities from spreadsheets. Keep your team's tracking sheets in sync.",
    icon: "📊",
    category: "storage",
    version: "1.0.0",
    author: "AaaS",
    status: "active",
    capabilities: ["import", "export"],
    configSchema: [
      {
        key: "spreadsheet_id",
        label: "Spreadsheet ID",
        type: "string",
        required: true,
        description: "Google Sheets spreadsheet ID from the URL",
      },
      {
        key: "sheet_name",
        label: "Sheet Name",
        type: "string",
        required: false,
        description: "Target sheet tab name (default: Sheet1)",
      },
      {
        key: "sync_direction",
        label: "Sync Direction",
        type: "select",
        required: true,
        options: ["export_only", "import_only", "bidirectional"],
        description: "Whether to export, import, or both",
      },
      {
        key: "auto_sync",
        label: "Auto Sync",
        type: "boolean",
        required: false,
        description: "Automatically sync on entity changes",
      },
    ],
    createdAt: "2026-02-10T00:00:00.000Z",
  },
  {
    id: "notion",
    name: "Notion",
    slug: "notion",
    description:
      "Sync AI entities with Notion databases. Keep your research wiki automatically updated with the latest entity data.",
    icon: "📝",
    category: "storage",
    version: "1.0.0",
    author: "AaaS",
    status: "active",
    capabilities: ["entity_sync", "import", "export"],
    configSchema: [
      {
        key: "integration_token",
        label: "Integration Token",
        type: "string",
        required: true,
        description: "Notion internal integration token",
      },
      {
        key: "database_id",
        label: "Database ID",
        type: "string",
        required: true,
        description: "Notion database ID to sync with",
      },
      {
        key: "sync_direction",
        label: "Sync Direction",
        type: "select",
        required: true,
        options: ["export_only", "import_only", "bidirectional"],
        description: "Whether to export, import, or both",
      },
      {
        key: "entity_types",
        label: "Entity Types",
        type: "select",
        required: false,
        options: ["all", "tool", "model", "agent", "skill", "benchmark"],
        description: "Which entity types to sync",
      },
    ],
    createdAt: "2026-02-15T00:00:00.000Z",
  },
];

// ── Functions ──────────────────────────────────────────────────────────

/**
 * Return all available plugins (built-in catalog).
 */
export async function getAvailablePlugins(): Promise<Plugin[]> {
  return BUILT_IN_PLUGINS.filter((p) => p.status !== "deprecated");
}

/**
 * Return installed plugins for a workspace.
 */
export async function getInstalledPlugins(
  workspaceId: string,
): Promise<PluginInstallation[]> {
  const q = query(
    collection(db, "plugin_installations"),
    where("workspaceId", "==", workspaceId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PluginInstallation);
}

/**
 * Install a plugin for a workspace.
 */
export async function installPlugin(
  workspaceId: string,
  pluginId: string,
  config: Record<string, unknown>,
): Promise<PluginInstallation> {
  const plugin = BUILT_IN_PLUGINS.find((p) => p.id === pluginId);
  if (!plugin) {
    throw new Error(`Plugin not found: ${pluginId}`);
  }

  // Validate required config fields
  for (const field of plugin.configSchema) {
    if (field.required && (config[field.key] === undefined || config[field.key] === "")) {
      throw new Error(`Missing required config field: ${field.label}`);
    }
  }

  const installation: Omit<PluginInstallation, "id"> = {
    pluginId,
    workspaceId,
    userId: "system",
    config,
    status: "active",
    installedAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, "plugin_installations"), installation);
  return { id: docRef.id, ...installation };
}

/**
 * Uninstall a plugin (delete installation record).
 */
export async function uninstallPlugin(installationId: string): Promise<void> {
  await deleteDoc(doc(db, "plugin_installations", installationId));
}

/**
 * Update config or status for an existing installation.
 */
export async function updatePluginConfig(
  installationId: string,
  config: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(db, "plugin_installations", installationId), config);
}

/**
 * Emit a plugin event — stores in Firestore and would dispatch to webhook.
 */
export async function emitPluginEvent(event: PluginEvent): Promise<void> {
  // Store the event
  await addDoc(collection(db, "plugin_events"), event);

  // In a real implementation, this would dispatch to the plugin's webhook URL.
  // For now we just record the event in Firestore.
  const installDoc = await getDoc(
    doc(db, "plugin_installations", event.installationId),
  );
  if (installDoc.exists()) {
    const installation = installDoc.data() as PluginInstallation;
    const plugin = BUILT_IN_PLUGINS.find((p) => p.id === installation.pluginId);
    if (plugin?.webhookUrl) {
      // Would POST to plugin.webhookUrl with event payload
      // console.log(`[plugin:${plugin.slug}] Would dispatch event: ${event.event}`);
    }
  }
}
