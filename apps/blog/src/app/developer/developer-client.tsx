"use client";

import { useState, type FormEvent } from "react";
import { Card, Button, Section, Container, cn } from "@aaas/ui";

const labelCx = "text-xs font-mono uppercase tracking-wider text-text-muted";
const inputCx =
  "w-full bg-surface border border-border rounded-lg py-2.5 px-4 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-circuit/50 focus:ring-1 focus:ring-circuit/20 transition-colors";

interface ApiKeyInfo {
  id: string;
  key?: string;
  keyPrefix: string;
  name: string;
  status: string;
  requestCount: number;
  rateLimit: number;
  createdAt: string;
  lastUsedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DeveloperClient() {
  // --- Register state ---
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDescription, setRegDescription] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<{ id: string; key: string; keyPrefix: string; name: string; rateLimit: number; createdAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // --- Manage state ---
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Register handler                                                 */
  /* ---------------------------------------------------------------- */

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setRegError(null);
    setNewKey(null);

    const name = regName.trim();
    const email = regEmail.trim();

    if (!name || name.length < 3 || name.length > 50) {
      setRegError("Name is required (3-50 characters).");
      return;
    }
    if (!email || !email.includes("@")) {
      setRegError("A valid email address is required.");
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          description: regDescription.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        setNewKey(data);
        setRegName("");
        setRegEmail("");
        setRegDescription("");
      } else {
        setRegError(data.error ?? `Registration failed (${res.status}).`);
      }
    } catch {
      setRegError("Network error — could not reach the API.");
    } finally {
      setRegLoading(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Lookup handler                                                   */
  /* ---------------------------------------------------------------- */

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setLookupError(null);
    setHasSearched(false);

    const email = lookupEmail.trim();
    if (!email || !email.includes("@")) {
      setLookupError("Enter a valid email address.");
      return;
    }

    setLookupLoading(true);
    try {
      const res = await fetch(`/api/keys?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (res.ok) {
        setKeys(data.keys ?? []);
        setHasSearched(true);
      } else {
        setLookupError(data.error ?? `Lookup failed (${res.status}).`);
      }
    } catch {
      setLookupError("Network error — could not reach the API.");
    } finally {
      setLookupLoading(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Revoke handler                                                   */
  /* ---------------------------------------------------------------- */

  async function handleRevoke(keyId: string) {
    const apiKey = prompt("Enter your full API key to confirm revocation:");
    if (!apiKey) return;

    setRevoking(keyId);
    try {
      const res = await fetch(`/api/keys/${keyId}`, {
        method: "DELETE",
        headers: { "x-api-key": apiKey },
      });

      const data = await res.json();

      if (res.ok) {
        setKeys((prev) =>
          prev.map((k) => (k.id === keyId ? { ...k, status: "revoked" } : k)),
        );
      } else {
        alert(data.error ?? "Revocation failed.");
      }
    } catch {
      alert("Network error — could not reach the API.");
    } finally {
      setRevoking(null);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Copy helper                                                      */
  /* ---------------------------------------------------------------- */

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* Hero */}
      <Section className="pt-28 pb-12">
        <Container className="max-w-3xl">
          <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">
            Developer Portal
          </p>
          <h1 className="text-3xl font-bold text-text mb-4">
            API Key Management
          </h1>
          <p className="text-text-muted leading-relaxed max-w-2xl">
            Register for an API key to access the AaaS Knowledge Index
            programmatically. Manage your existing keys and review the API
            documentation below.
          </p>
        </Container>
      </Section>

      {/* Section 1: Register */}
      <Section className="pb-10">
        <Container className="max-w-3xl">
          <Card>
            <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
              Register for API Key
            </h2>

            {regError && (
              <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
                {regError}
              </div>
            )}

            {newKey && (
              <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                <p className="text-sm text-emerald-400 font-semibold">
                  API key created successfully
                </p>
                <div className="bg-surface rounded-lg p-3 font-mono text-sm text-text break-all select-all">
                  {newKey.key}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyKey}
                    className="text-xs font-mono text-circuit hover:underline"
                  >
                    {copied ? "Copied!" : "Copy to clipboard"}
                  </button>
                </div>
                <p className="text-xs text-red-400 font-mono">
                  WARNING: This key will not be shown again. Save it now.
                </p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="reg-name" className={labelCx}>
                  Name <span className="text-accent-red">*</span>
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Your name or app name (3-50 chars)"
                  className={cn(inputCx, "mt-1.5")}
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>

              <div>
                <label htmlFor="reg-email" className={labelCx}>
                  Email <span className="text-accent-red">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn(inputCx, "mt-1.5")}
                  required
                />
              </div>

              <div>
                <label htmlFor="reg-description" className={labelCx}>
                  Description{" "}
                  <span className="normal-case tracking-normal text-text-muted/60">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="reg-description"
                  value={regDescription}
                  onChange={(e) => setRegDescription(e.target.value)}
                  placeholder="What will you use this key for?"
                  rows={2}
                  className={cn(inputCx, "mt-1.5 resize-y")}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={regLoading}
                  className="w-full sm:w-auto"
                >
                  {regLoading ? "Generating..." : "Generate API Key"}
                </Button>
              </div>
            </form>
          </Card>
        </Container>
      </Section>

      {/* Divider */}
      <Section className="pb-6">
        <Container className="max-w-3xl">
          <div className="flex items-center gap-4">
            <div className="flex-grow border-t border-border" />
            <p className="text-xs font-mono uppercase tracking-wider text-text-muted shrink-0">
              Manage existing keys
            </p>
            <div className="flex-grow border-t border-border" />
          </div>
        </Container>
      </Section>

      {/* Section 2: Manage Keys */}
      <Section className="pb-10">
        <Container className="max-w-3xl">
          <Card>
            <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
              Your API Keys
            </h2>

            {lookupError && (
              <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
                {lookupError}
              </div>
            )}

            <form onSubmit={handleLookup} className="flex gap-3 mb-6">
              <input
                type="email"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                placeholder="Enter your email to look up keys"
                className={cn(inputCx, "flex-1")}
                required
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={lookupLoading}
                className="shrink-0"
              >
                {lookupLoading ? "Loading..." : "Look up"}
              </Button>
            </form>

            {hasSearched && keys.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4">
                No API keys found for this email.
              </p>
            )}

            {keys.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 pr-4 font-mono text-xs text-text-muted">
                        Key
                      </th>
                      <th className="pb-2 pr-4 font-mono text-xs text-text-muted">
                        Name
                      </th>
                      <th className="pb-2 pr-4 font-mono text-xs text-text-muted">
                        Status
                      </th>
                      <th className="pb-2 pr-4 font-mono text-xs text-text-muted">
                        Requests
                      </th>
                      <th className="pb-2 pr-4 font-mono text-xs text-text-muted">
                        Created
                      </th>
                      <th className="pb-2 pr-4 font-mono text-xs text-text-muted">
                        Last Used
                      </th>
                      <th className="pb-2 font-mono text-xs text-text-muted" />
                    </tr>
                  </thead>
                  <tbody className="text-text">
                    {keys.map((k) => (
                      <tr
                        key={k.id}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2.5 pr-4 font-mono text-xs">
                          {k.keyPrefix}...
                        </td>
                        <td className="py-2.5 pr-4 text-xs">{k.name}</td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 rounded-full text-xs font-mono",
                              k.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-red-500/10 text-red-400 border border-red-500/30",
                            )}
                          >
                            {k.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs">
                          {k.requestCount}
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-text-muted">
                          {new Date(k.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-text-muted">
                          {k.lastUsedAt
                            ? new Date(k.lastUsedAt).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="py-2.5">
                          {k.status === "active" && (
                            <button
                              onClick={() => handleRevoke(k.id)}
                              disabled={revoking === k.id}
                              className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                            >
                              {revoking === k.id ? "Revoking..." : "Revoke"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </Container>
      </Section>

      {/* Section 3: API Documentation */}
      <Section className="pb-20">
        <Container className="max-w-3xl">
          <Card>
            <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
              API Documentation — Quick Reference
            </h2>

            <div className="space-y-5">
              {/* Base URL */}
              <div>
                <p className={cn(labelCx, "mb-1.5")}>Base URL</p>
                <div className="bg-surface rounded-lg p-3 font-mono text-sm text-text">
                  https://aaas.blog/api
                </div>
              </div>

              {/* Authentication */}
              <div>
                <p className={cn(labelCx, "mb-1.5")}>Authentication</p>
                <div className="bg-surface rounded-lg p-3 font-mono text-sm text-text">
                  x-api-key: aaas_your_key_here
                </div>
              </div>

              {/* Rate Limit */}
              <div>
                <p className={cn(labelCx, "mb-1.5")}>Rate Limit</p>
                <p className="text-sm text-text">
                  <span className="font-mono text-circuit">100</span> requests
                  per day per key
                </p>
              </div>

              {/* Endpoints */}
              <div>
                <p className={cn(labelCx, "mb-2")}>Available Endpoints</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 pr-4 font-mono text-xs text-text-muted">
                          Method
                        </th>
                        <th className="pb-2 pr-4 font-mono text-xs text-text-muted">
                          Endpoint
                        </th>
                        <th className="pb-2 font-mono text-xs text-text-muted">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-text">
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs text-circuit">
                          GET
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">
                          /api/entities
                        </td>
                        <td className="py-2 text-xs text-text-muted">
                          List and filter all entities
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs text-circuit">
                          GET
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">
                          /api/search
                        </td>
                        <td className="py-2 text-xs text-text-muted">
                          Full-text search across all entities
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs text-circuit">
                          POST
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">
                          /api/submit
                        </td>
                        <td className="py-2 text-xs text-text-muted">
                          Submit a new entity for review
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs text-circuit">
                          GET
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">
                          /api/export
                        </td>
                        <td className="py-2 text-xs text-text-muted">
                          Export entities as JSON or CSV
                        </td>
                      </tr>
                      <tr className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs text-circuit">
                          GET
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">
                          /api/leaderboard/:cat
                        </td>
                        <td className="py-2 text-xs text-text-muted">
                          Leaderboard rankings by category
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
