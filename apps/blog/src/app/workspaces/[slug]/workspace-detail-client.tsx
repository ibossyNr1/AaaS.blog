"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, Button } from "@aaas/ui";
import type {
  Workspace,
  WorkspaceMember,
} from "@/lib/workspaces";
import type { Role } from "@/lib/rbac";
import { ThemeEditor } from "@/components/theme-editor";
import { ThemeInjector } from "@/components/theme-injector";
import { PermissionGate } from "@/components/permission-gate";
import { RoleBadge } from "@/components/role-badge";
import { RoleSelector } from "@/components/role-selector";
import { BUILT_IN_THEMES, type ThemeConfig } from "@/lib/theming";

type Tab = "overview" | "members" | "settings" | "collections";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-surface text-text-muted border border-border",
  team: "bg-circuit/10 text-circuit border border-circuit/30",
  enterprise: "bg-accent-red/10 text-accent-red border border-accent-red/30",
};

interface Props {
  slug: string;
}

export function WorkspaceDetailClient({ slug }: Props) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [userRole, setUserRole] = useState<WorkspaceMember["role"] | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("aaas-user-id") || "anonymous"
      : "anonymous";

  const canEdit = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${slug}`);
      if (!res.ok) {
        setError("Workspace not found");
        return;
      }
      const json = await res.json();
      setWorkspace(json.data);
    } catch {
      setError("Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchMembers = useCallback(async () => {
    if (!workspace) return;
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`);
      if (res.ok) {
        const json = await res.json();
        const memberList: WorkspaceMember[] = json.data || [];
        setMembers(memberList);
        const me = memberList.find((m) => m.userId === userId);
        if (me) setUserRole(me.role);
      }
    } catch {
      // silent
    }
  }, [workspace, userId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    if (workspace) fetchMembers();
  }, [workspace, fetchMembers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-text-muted font-mono text-sm animate-pulse">
          Loading workspace...
        </span>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <Card className="text-center py-16">
        <p className="text-text-muted mb-4">{error || "Workspace not found"}</p>
        <Link href="/workspaces">
          <Button variant="secondary">Back to Workspaces</Button>
        </Link>
      </Card>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "members", label: `Members (${members.length})` },
    ...(canEdit ? [{ key: "settings" as Tab, label: "Settings" }] : []),
    { key: "collections", label: "Collections" },
  ];

  // Build a ThemeConfig from workspace theme (if set), for ThemeInjector
  const workspaceThemeConfig: ThemeConfig | undefined = workspace.theme
    ? {
        id: `workspace-${workspace.id}`,
        name: `${workspace.name} Theme`,
        isDark: true,
        colors: {
          primary: workspace.theme.primaryColor,
          accent: workspace.theme.accentColor,
          background: workspace.theme.backgroundColor,
          surface: workspace.theme.backgroundColor,
          text: "#ffffff",
          textMuted: "#a0a0a0",
          border: "#2a2a2a",
        },
      }
    : undefined;

  return (
    <div className="pb-16">
      {/* Inject workspace custom theme CSS vars */}
      <ThemeInjector theme={workspaceThemeConfig} />

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/workspaces"
          className="text-sm text-text-muted hover:text-circuit font-mono mb-4 inline-block"
        >
          &larr; All Workspaces
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {workspace.logoUrl ? (
              <img
                src={workspace.logoUrl}
                alt=""
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-circuit/10 flex items-center justify-center text-circuit font-bold text-xl">
                {workspace.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-text">{workspace.name}</h1>
              <p className="text-sm text-text-muted font-mono">
                /{workspace.slug}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userRole && (
              <RoleBadge role={userRole as Role} size="sm" />
            )}
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${PLAN_COLORS[workspace.plan]}`}
            >
              {workspace.plan}
            </span>
          </div>
        </div>
        {workspace.description && (
          <p className="text-text-muted mt-3 max-w-2xl">
            {workspace.description}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-mono transition-colors relative ${
              activeTab === tab.key
                ? "text-circuit"
                : "text-text-muted hover:text-text"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-circuit" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab workspace={workspace} members={members} />
      )}
      {activeTab === "members" && (
        <MembersTab
          workspace={workspace}
          members={members}
          canEdit={canEdit}
          userId={userId}
          userRole={userRole as Role | null}
          onRefresh={fetchMembers}
        />
      )}
      {activeTab === "settings" && canEdit && (
        <PermissionGate
          permission="manage_settings"
          workspaceId={workspace.id}
          fallback={
            <Card className="text-center py-12">
              <p className="text-text-muted text-sm">
                You do not have permission to manage settings.
              </p>
            </Card>
          }
        >
          <SettingsTab
            workspace={workspace}
            isOwner={isOwner}
            userId={userId}
            onRefresh={fetchWorkspace}
          />
        </PermissionGate>
      )}
      {activeTab === "collections" && <CollectionsTab />}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────

function OverviewTab({
  workspace,
  members,
}: {
  workspace: Workspace;
  members: WorkspaceMember[];
}) {
  const stats = [
    { label: "Members", value: members.length },
    {
      label: "Plan",
      value: workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1),
    },
    { label: "Visibility", value: workspace.settings.isPublic ? "Public" : "Private" },
    { label: "Max Members", value: workspace.settings.maxMembers },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} variant="glass" className="p-4 text-center">
            <p className="text-2xl font-bold text-text">{stat.value}</p>
            <p className="text-xs font-mono text-text-muted mt-1">
              {stat.label}
            </p>
          </Card>
        ))}
      </div>

      {/* Details */}
      <Card variant="glass" className="p-5">
        <h3 className="text-sm font-mono text-text-muted mb-3 uppercase tracking-wider">
          Details
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Created</dt>
            <dd className="text-text font-mono">
              {new Date(workspace.createdAt).toLocaleDateString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Last Updated</dt>
            <dd className="text-text font-mono">
              {new Date(workspace.updatedAt).toLocaleDateString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Submissions</dt>
            <dd className="text-text font-mono">
              {workspace.settings.allowSubmissions ? "Enabled" : "Disabled"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Digest</dt>
            <dd className="text-text font-mono">
              {workspace.settings.defaultDigestFrequency}
            </dd>
          </div>
          {workspace.settings.customDomain && (
            <div className="flex justify-between">
              <dt className="text-text-muted">Custom Domain</dt>
              <dd className="text-text font-mono">
                {workspace.settings.customDomain}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Recent members */}
      <Card variant="glass" className="p-5">
        <h3 className="text-sm font-mono text-text-muted mb-3 uppercase tracking-wider">
          Team
        </h3>
        <div className="space-y-2">
          {members.slice(0, 5).map((m) => (
            <div
              key={m.userId}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-circuit/10 flex items-center justify-center text-circuit text-[10px] font-bold">
                  {(m.displayName || m.email || m.userId)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <span className="text-text">
                  {m.displayName || m.email || m.userId}
                </span>
              </div>
              <RoleBadge role={m.role as Role} size="sm" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Members Tab ────────────────────────────────────────────────────────

function MembersTab({
  workspace,
  members,
  canEdit,
  userId,
  userRole,
  onRefresh,
}: {
  workspace: Workspace;
  members: WorkspaceMember[];
  canEdit: boolean;
  userId: string;
  userRole: Role | null;
  onRefresh: () => void;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">(
    "viewer"
  );
  const [inviting, setInviting] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setActionError("");

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          targetUserId: inviteUserId,
          role: inviteRole,
          email: inviteEmail,
          displayName: "",
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setActionError(json.error || "Failed to add member");
        return;
      }

      setShowInvite(false);
      setInviteUserId("");
      setInviteEmail("");
      setInviteRole("viewer");
      onRefresh();
    } catch {
      setActionError("Network error");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (targetUserId: string) => {
    if (!confirm("Remove this member from the workspace?")) return;

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="space-y-4">
      <PermissionGate
        permission="manage_members"
        workspaceId={workspace.id}
      >
        <div className="flex justify-end mb-2">
          <Button
            variant="primary"
            onClick={() => setShowInvite(!showInvite)}
          >
            {showInvite ? "Cancel" : "+ Add Member"}
          </Button>
        </div>
      </PermissionGate>

      {showInvite && (
        <Card variant="glass" className="p-5 mb-4">
          <h3 className="text-sm font-semibold text-text mb-3">Add Member</h3>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
                placeholder="User ID"
                required
                className="px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit font-mono"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email (optional)"
                className="px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit"
              />
              <RoleSelector
                currentRole={inviteRole as Role}
                onChange={(role) => setInviteRole(role as "admin" | "editor" | "viewer")}
                maxRole={userRole ?? "viewer"}
              />
            </div>
            {actionError && (
              <p className="text-sm text-accent-red font-mono">{actionError}</p>
            )}
            <Button type="submit" variant="primary" disabled={inviting}>
              {inviting ? "Adding..." : "Add Member"}
            </Button>
          </form>
        </Card>
      )}

      {/* Member list */}
      <div className="space-y-2">
        {members.map((m) => (
          <Card key={m.userId} variant="glass" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-circuit/10 flex items-center justify-center text-circuit text-xs font-bold">
                  {(m.displayName || m.email || m.userId)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-text">
                    {m.displayName || m.userId}
                  </p>
                  {m.email && (
                    <p className="text-xs text-text-muted font-mono">
                      {m.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RoleBadge role={m.role as Role} size="sm" />
                {canEdit &&
                  m.role !== "owner" &&
                  m.userId !== userId && (
                    <button
                      onClick={() => handleRemove(m.userId)}
                      className="text-xs text-text-muted hover:text-accent-red transition-colors font-mono"
                    >
                      Remove
                    </button>
                  )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {members.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-text-muted text-sm">No members yet.</p>
        </Card>
      )}
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────────────────────

function SettingsTab({
  workspace,
  isOwner,
  userId,
  onRefresh,
}: {
  workspace: Workspace;
  isOwner: boolean;
  userId: string;
  onRefresh: () => void;
}) {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description);
  const [isPublic, setIsPublic] = useState(workspace.settings.isPublic);
  const [allowSubmissions, setAllowSubmissions] = useState(
    workspace.settings.allowSubmissions
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          name,
          description,
          settings: {
            ...workspace.settings,
            isPublic,
            allowSubmissions,
          },
        }),
      });

      if (res.ok) {
        setSaved(true);
        onRefresh();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
      if (res.ok) {
        window.location.href = "/workspaces";
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="space-y-6">
      <Card variant="glass" className="p-5">
        <h3 className="text-sm font-mono text-text-muted mb-4 uppercase tracking-wider">
          General
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-mono text-text-muted mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit"
            />
          </div>
          <div>
            <label className="block text-sm font-mono text-text-muted mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit resize-none"
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-border"
              />
              Public workspace
            </label>
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
              <input
                type="checkbox"
                checked={allowSubmissions}
                onChange={(e) => setAllowSubmissions(e.target.checked)}
                className="rounded border-border"
              />
              Allow external submissions
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            {saved && (
              <span className="text-sm text-circuit font-mono">Saved</span>
            )}
          </div>
        </form>
      </Card>

      {/* Theme customization */}
      <PermissionGate
        permission="manage_theme"
        workspaceId={workspace.id}
      >
        <Card variant="glass" className="p-5">
          <h3 className="text-sm font-mono text-text-muted mb-4 uppercase tracking-wider">
            Workspace Theme
          </h3>
          <ThemeEditor
            initialTheme={
              workspace.theme
                ? {
                    id: `workspace-${workspace.id}`,
                    name: `${workspace.name} Theme`,
                    isDark: true,
                    colors: {
                      primary: workspace.theme.primaryColor,
                      accent: workspace.theme.accentColor,
                      background: workspace.theme.backgroundColor,
                      surface: workspace.theme.backgroundColor,
                      text: "#ffffff",
                      textMuted: "#a0a0a0",
                      border: "#2a2a2a",
                    },
                  }
                : BUILT_IN_THEMES[0]
            }
            onSave={async (theme) => {
              try {
                await fetch(`/api/workspaces/${workspace.id}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    "x-user-id": userId,
                  },
                  body: JSON.stringify({
                    theme: {
                      primaryColor: theme.colors.primary,
                      accentColor: theme.colors.accent,
                      backgroundColor: theme.colors.background,
                    },
                  }),
                });
                onRefresh();
              } catch {
                // silent
              }
            }}
          />
        </Card>
      </PermissionGate>

      {/* Danger zone */}
      {isOwner && (
        <Card variant="glass" className="p-5 border-accent-red/30">
          <h3 className="text-sm font-mono text-accent-red mb-3 uppercase tracking-wider">
            Danger Zone
          </h3>
          {!deleteConfirm ? (
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(true)}
              className="text-accent-red hover:bg-accent-red/10"
            >
              Delete Workspace
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                This will permanently delete the workspace, all members, and all
                associated data. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  className="text-accent-red hover:bg-accent-red/10"
                >
                  Confirm Delete
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Collections Tab ────────────────────────────────────────────────────

function CollectionsTab() {
  return (
    <Card className="text-center py-16">
      <svg
        className="mx-auto mb-4 w-12 h-12 text-text-muted/40"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
        />
      </svg>
      <p className="text-text-muted mb-2">Collections coming soon</p>
      <p className="text-xs text-text-muted font-mono">
        Curate entity lists and share them with your workspace team.
      </p>
    </Card>
  );
}
