"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, Button } from "@aaas/ui";
import type { Workspace, WorkspaceMember } from "@/lib/workspaces";
import type { Role } from "@/lib/rbac";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { RoleBadge } from "@/components/role-badge";

type WorkspaceWithRole = Workspace & { role: WorkspaceMember["role"] };

const PLAN_COLORS: Record<string, string> = {
  free: "bg-surface text-text-muted border border-border",
  team: "bg-circuit/10 text-circuit border border-circuit/30",
  enterprise: "bg-accent-red/10 text-accent-red border border-accent-red/30",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function WorkspacesClient() {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [plan, setPlan] = useState<"free" | "team" | "enterprise">("free");
  const [isPublic, setIsPublic] = useState(true);

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("aaas-user-id") || "anonymous"
      : "anonymous";

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces", {
        headers: { "x-user-id": userId },
      });
      if (res.ok) {
        const json = await res.json();
        setWorkspaces(json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          description,
          plan,
          settings: {
            isPublic,
            allowSubmissions: false,
            defaultDigestFrequency: "weekly",
            maxMembers: plan === "enterprise" ? 100 : plan === "team" ? 25 : 5,
          },
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to create workspace");
        return;
      }

      setShowCreate(false);
      setName("");
      setSlug("");
      setDescription("");
      setPlan("free");
      setIsPublic(true);
      fetchWorkspaces();
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Workspaces" },
          ]}
        />
        <LoadingSkeleton variant="card" count={4} className="grid-cols-1 md:grid-cols-2" />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Workspaces" },
        ]}
      />

      {/* Actions bar */}
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-text-muted font-mono">
          {workspaces.length}{" "}
          {workspaces.length === 1 ? "workspace" : "workspaces"}
        </p>
        <Button variant="primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ New Workspace"}
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card variant="glass" className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-text mb-4">
            Create Workspace
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono text-text-muted mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(slugify(e.target.value));
                  }}
                  placeholder="My Workspace"
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-text-muted mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-workspace"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono text-text-muted mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace for?"
                rows={2}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono text-text-muted mb-1">
                  Plan
                </label>
                <select
                  value={plan}
                  onChange={(e) =>
                    setPlan(e.target.value as "free" | "team" | "enterprise")
                  }
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:border-circuit"
                >
                  <option value="free">Free (5 members)</option>
                  <option value="team">Team (25 members)</option>
                  <option value="enterprise">Enterprise (100 members)</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-border"
                  />
                  Public workspace
                </label>
              </div>
            </div>

            {error && (
              <p className="text-sm text-accent-red font-mono">{error}</p>
            )}

            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={creating}>
                {creating ? "Creating..." : "Create Workspace"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Workspaces grid */}
      {workspaces.length === 0 && !showCreate ? (
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
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21"
            />
          </svg>
          <p className="text-text-muted mb-4">
            No workspaces yet. Create your first workspace to start
            collaborating.
          </p>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + New Workspace
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspaces.map((ws) => (
            <Link key={ws.id} href={`/workspaces/${ws.slug}`}>
              <Card
                variant="glass"
                className="p-5 hover:border-circuit/40 transition-colors cursor-pointer h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {ws.logoUrl ? (
                      <img
                        src={ws.logoUrl}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-circuit/10 flex items-center justify-center text-circuit font-bold text-sm">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3 className="text-base font-semibold text-text">
                      {ws.name}
                    </h3>
                  </div>
                  <RoleBadge role={ws.role as Role} size="sm" />
                </div>

                {ws.description && (
                  <p className="text-sm text-text-muted line-clamp-2 mb-3">
                    {ws.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-auto">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${PLAN_COLORS[ws.plan]}`}
                  >
                    {ws.plan}
                  </span>
                  {ws.settings.isPublic ? (
                    <span className="text-[10px] font-mono text-text-muted">
                      Public
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-text-muted">
                      Private
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
