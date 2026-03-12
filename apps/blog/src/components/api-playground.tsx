"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, Badge, Button, cn } from "@aaas/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EndpointDef {
  id: string;
  category: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  label: string;
  pathParams?: { name: string; placeholder: string }[];
  queryParams?: { name: string; placeholder: string; default?: string }[];
  hasBody?: boolean;
  bodyExample?: Record<string, unknown>;
}

interface HistoryEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status: number;
  duration: number;
}

// ---------------------------------------------------------------------------
// Endpoints catalog
// ---------------------------------------------------------------------------

const ENDPOINTS: EndpointDef[] = [
  // Entities
  { id: "list-entities", category: "Entities", method: "GET", path: "/entities", label: "List entities", queryParams: [{ name: "type", placeholder: "tool" }, { name: "channel", placeholder: "ai-tools" }, { name: "limit", placeholder: "50" }] },
  { id: "get-entity", category: "Entities", method: "GET", path: "/entity/{type}/{slug}", label: "Get entity", pathParams: [{ name: "type", placeholder: "tool" }, { name: "slug", placeholder: "langchain" }] },
  { id: "entity-changelog", category: "Entities", method: "GET", path: "/entity/{type}/{slug}/changelog", label: "Entity changelog", pathParams: [{ name: "type", placeholder: "tool" }, { name: "slug", placeholder: "langchain" }] },
  { id: "entity-similar", category: "Entities", method: "GET", path: "/entity/{type}/{slug}/similar", label: "Similar entities", pathParams: [{ name: "type", placeholder: "tool" }, { name: "slug", placeholder: "langchain" }], queryParams: [{ name: "limit", placeholder: "5" }] },

  // Search
  { id: "search", category: "Search", method: "GET", path: "/search", label: "Search entities", queryParams: [{ name: "q", placeholder: "langchain" }, { name: "type", placeholder: "tool" }, { name: "sort", placeholder: "composite" }, { name: "limit", placeholder: "20" }] },

  // Leaderboard
  { id: "leaderboard", category: "Leaderboard", method: "GET", path: "/leaderboard/{category}", label: "Get leaderboard", pathParams: [{ name: "category", placeholder: "all" }], queryParams: [{ name: "limit", placeholder: "25" }] },

  // Trending & Activity
  { id: "trending", category: "Trending", method: "GET", path: "/trending", label: "Get trending", queryParams: [{ name: "limit", placeholder: "10" }] },
  { id: "activity", category: "Activity", method: "GET", path: "/activity", label: "Get activity feed" },

  // Submit
  { id: "submit", category: "Submit", method: "POST", path: "/submit", label: "Submit entity", hasBody: true, bodyExample: { name: "My Tool", type: "tool", description: "A great AI tool", provider: "Acme Corp", category: "ai-tools", tags: ["ai", "automation"] } },

  // Export
  { id: "export-entities", category: "Export", method: "GET", path: "/export/entities", label: "Export entities", queryParams: [{ name: "format", placeholder: "json" }, { name: "type", placeholder: "tool" }, { name: "fields", placeholder: "name,provider,composite" }] },

  // Keys
  { id: "create-key", category: "Keys", method: "POST", path: "/keys", label: "Create API key", hasBody: true, bodyExample: { name: "my-app", email: "dev@example.com" } },
  { id: "list-keys", category: "Keys", method: "GET", path: "/keys", label: "List keys", queryParams: [{ name: "email", placeholder: "dev@example.com" }] },

  // Bookmarks
  { id: "get-bookmarks", category: "Bookmarks", method: "GET", path: "/bookmarks", label: "Get bookmarks" },
  { id: "add-bookmark", category: "Bookmarks", method: "POST", path: "/bookmarks", label: "Add bookmark", hasBody: true, bodyExample: { entityType: "tool", entitySlug: "langchain" } },

  // Collections
  { id: "list-collections", category: "Collections", method: "GET", path: "/collections", label: "List collections" },
  { id: "create-collection", category: "Collections", method: "POST", path: "/collections", label: "Create collection", hasBody: true, bodyExample: { name: "My favorites", description: "Top AI tools" } },

  // Webhooks
  { id: "register-webhook", category: "Webhooks", method: "POST", path: "/webhooks", label: "Register webhook", hasBody: true, bodyExample: { url: "https://example.com/webhook", events: ["entity.created", "entity.updated"] } },

  // Subscriptions
  { id: "subscribe", category: "Subscriptions", method: "POST", path: "/subscribe", label: "Subscribe", hasBody: true, bodyExample: { email: "user@example.com" } },

  // Badge
  { id: "badge", category: "Badge", method: "GET", path: "/badge/{type}/{slug}", label: "Get badge SVG", pathParams: [{ name: "type", placeholder: "tool" }, { name: "slug", placeholder: "langchain" }], queryParams: [{ name: "metric", placeholder: "composite" }] },

  // OpenAPI
  { id: "openapi", category: "SDKs", method: "GET", path: "/openapi", label: "OpenAPI spec" },
];

const CATEGORIES = [...new Set(ENDPOINTS.map((e) => e.category))];

const inputCx =
  "w-full bg-surface border border-border rounded-lg py-2 px-3 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-circuit/50 focus:ring-1 focus:ring-circuit/20 transition-colors font-mono";

const labelCx = "text-xs font-mono uppercase tracking-wider text-text-muted";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  POST: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/30",
};

// ---------------------------------------------------------------------------
// History helpers
// ---------------------------------------------------------------------------

const HISTORY_KEY = "aaas-playground-history";

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 20)));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApiPlayground() {
  const [selectedId, setSelectedId] = useState(ENDPOINTS[0].id);
  const [apiKey, setApiKey] = useState("");
  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [bodyStr, setBodyStr] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const endpoint = ENDPOINTS.find((e) => e.id === selectedId)!;

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Reset fields when endpoint changes
  useEffect(() => {
    setPathValues({});
    setQueryValues({});
    setBodyStr(endpoint.bodyExample ? JSON.stringify(endpoint.bodyExample, null, 2) : "");
    setResponse(null);
    setStatus(null);
    setDuration(null);
  }, [selectedId, endpoint.bodyExample]);

  // Build URL
  const buildUrl = useCallback(() => {
    let path = endpoint.path;
    for (const p of endpoint.pathParams ?? []) {
      const val = pathValues[p.name] || p.placeholder;
      path = path.replace(`{${p.name}}`, val);
    }

    const qs = new URLSearchParams();
    for (const q of endpoint.queryParams ?? []) {
      const val = queryValues[q.name];
      if (val) qs.set(q.name, val);
    }
    const query = qs.toString();
    return `/api${path}${query ? `?${query}` : ""}`;
  }, [endpoint, pathValues, queryValues]);

  // Generate curl
  const buildCurl = useCallback(() => {
    const url = `https://aaas.blog${buildUrl()}`;
    const lines = [`curl -X ${endpoint.method} "${url}"`];
    if (apiKey) lines.push(`  -H "x-api-key: ${apiKey}"`);
    if (endpoint.hasBody) {
      lines.push(`  -H "Content-Type: application/json"`);
      lines.push(`  -d '${bodyStr.replace(/\n/g, "")}'`);
    }
    return lines.join(" \\\n");
  }, [endpoint, apiKey, bodyStr, buildUrl]);

  // Send request
  const handleSend = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    setStatus(null);
    setDuration(null);

    const url = buildUrl();
    const headers: Record<string, string> = {};
    if (apiKey) headers["x-api-key"] = apiKey;

    const init: RequestInit = { method: endpoint.method, headers };
    if (endpoint.hasBody && bodyStr) {
      headers["Content-Type"] = "application/json";
      init.body = bodyStr;
    }

    const start = performance.now();
    try {
      const res = await fetch(url, init);
      const elapsed = Math.round(performance.now() - start);
      setDuration(elapsed);
      setStatus(res.status);

      const contentType = res.headers.get("content-type") ?? "";
      let body: string;
      if (contentType.includes("json")) {
        const json = await res.json();
        body = JSON.stringify(json, null, 2);
      } else if (contentType.includes("svg") || contentType.includes("xml")) {
        body = await res.text();
      } else {
        body = await res.text();
      }
      setResponse(body);

      // Save to history
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        method: endpoint.method,
        url,
        status: res.status,
        duration: elapsed,
      };
      const updated = [entry, ...history].slice(0, 20);
      setHistory(updated);
      saveHistory(updated);
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setDuration(elapsed);
      setStatus(0);
      setResponse(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [endpoint, apiKey, bodyStr, buildUrl, history]);

  // Copy curl
  const handleCopyCurl = useCallback(() => {
    navigator.clipboard.writeText(buildCurl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildCurl]);

  return (
    <div className="flex gap-6 flex-col lg:flex-row">
      {/* ---- Left: Endpoint selector ---- */}
      <div className="lg:w-64 shrink-0">
        {/* API key */}
        <Card className="mb-4">
          <p className={cn(labelCx, "mb-2")}>API Key</p>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="aaas_your_key_here"
            className={inputCx}
          />
        </Card>

        {/* Endpoints grouped by category */}
        <Card>
          <p className={cn(labelCx, "mb-3")}>Endpoints</p>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted/60 mb-1.5">
                  {cat}
                </p>
                <div className="space-y-0.5">
                  {ENDPOINTS.filter((e) => e.category === cat).map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => setSelectedId(ep.id)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-2",
                        selectedId === ep.id
                          ? "bg-circuit/10 text-circuit"
                          : "text-text-muted hover:text-text hover:bg-surface",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block px-1 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0",
                          METHOD_COLORS[ep.method],
                        )}
                      >
                        {ep.method}
                      </span>
                      <span className="truncate">{ep.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ---- Right: Request builder + response ---- */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Request header */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <span
              className={cn(
                "inline-block px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border",
                METHOD_COLORS[endpoint.method],
              )}
            >
              {endpoint.method}
            </span>
            <code className="text-sm font-mono text-text flex-1 truncate">
              {buildUrl()}
            </code>
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={loading}
              className="shrink-0"
            >
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>

          {/* Path params */}
          {endpoint.pathParams && endpoint.pathParams.length > 0 && (
            <div className="mb-4">
              <p className={cn(labelCx, "mb-2")}>Path Parameters</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {endpoint.pathParams.map((p) => (
                  <div key={p.name}>
                    <label className="text-[10px] font-mono text-text-muted mb-1 block">
                      {`{${p.name}}`}
                    </label>
                    <input
                      type="text"
                      value={pathValues[p.name] ?? ""}
                      onChange={(e) =>
                        setPathValues((prev) => ({ ...prev, [p.name]: e.target.value }))
                      }
                      placeholder={p.placeholder}
                      className={inputCx}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query params */}
          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <div className="mb-4">
              <p className={cn(labelCx, "mb-2")}>Query Parameters</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {endpoint.queryParams.map((q) => (
                  <div key={q.name}>
                    <label className="text-[10px] font-mono text-text-muted mb-1 block">
                      {q.name}
                    </label>
                    <input
                      type="text"
                      value={queryValues[q.name] ?? ""}
                      onChange={(e) =>
                        setQueryValues((prev) => ({ ...prev, [q.name]: e.target.value }))
                      }
                      placeholder={q.placeholder}
                      className={inputCx}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request body */}
          {endpoint.hasBody && (
            <div>
              <p className={cn(labelCx, "mb-2")}>Request Body</p>
              <textarea
                value={bodyStr}
                onChange={(e) => setBodyStr(e.target.value)}
                rows={8}
                className={cn(inputCx, "resize-y")}
                spellCheck={false}
              />
            </div>
          )}
        </Card>

        {/* Curl command */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className={cn(labelCx)}>cURL Command</p>
            <button
              onClick={handleCopyCurl}
              className="text-xs font-mono text-text-muted hover:text-circuit transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="bg-[rgb(var(--basalt-deep))] rounded-lg p-3 overflow-x-auto">
            <pre className="text-xs font-mono text-text whitespace-pre-wrap break-all">
              {buildCurl()}
            </pre>
          </div>
        </Card>

        {/* Response */}
        {(response !== null || loading) && (
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <p className={cn(labelCx)}>Response</p>
              {status !== null && (
                <Badge
                  className={cn(
                    "text-xs",
                    status >= 200 && status < 300
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : status === 0
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30",
                  )}
                >
                  {status === 0 ? "ERR" : status}
                </Badge>
              )}
              {duration !== null && (
                <span className="text-[10px] font-mono text-text-muted">
                  {duration}ms
                </span>
              )}
            </div>
            <div className="bg-[rgb(var(--basalt-deep))] rounded-lg p-4 overflow-x-auto max-h-[50vh] overflow-y-auto">
              {loading ? (
                <p className="text-xs font-mono text-text-muted animate-pulse">
                  Waiting for response...
                </p>
              ) : (
                <pre className="text-xs font-mono text-text whitespace-pre-wrap break-all">
                  {response}
                </pre>
              )}
            </div>
          </Card>
        )}

        {/* History */}
        {history.length > 0 && (
          <Card>
            <p className={cn(labelCx, "mb-3")}>Recent Requests</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono hover:bg-surface transition-colors"
                >
                  <span
                    className={cn(
                      "inline-block px-1 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0",
                      METHOD_COLORS[h.method] ?? "text-text-muted",
                    )}
                  >
                    {h.method}
                  </span>
                  <span className="text-text truncate flex-1">{h.url}</span>
                  <span
                    className={cn(
                      "shrink-0",
                      h.status >= 200 && h.status < 300
                        ? "text-emerald-400"
                        : "text-red-400",
                    )}
                  >
                    {h.status}
                  </span>
                  <span className="text-text-muted shrink-0">{h.duration}ms</span>
                  <span className="text-text-muted/50 shrink-0">
                    {new Date(h.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
