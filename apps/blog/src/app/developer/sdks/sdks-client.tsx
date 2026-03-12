"use client";

import { useState, useMemo } from "react";
import { Card, Button, Section, Container } from "@aaas/ui";

// ---------------------------------------------------------------------------
// Syntax highlighting (reuses same pattern as code-example)
// ---------------------------------------------------------------------------

interface CodeToken {
  text: string;
  className?: string;
}

type Lang = "typescript" | "python" | "bash";

const KEYWORDS: Record<Lang, Set<string>> = {
  typescript: new Set(["import", "from", "const", "let", "new", "await", "async", "function", "return", "export", "type", "interface", "class"]),
  python: new Set(["import", "from", "def", "return", "if", "else", "print", "True", "False", "None", "async", "await", "class"]),
  bash: new Set(["npm", "pip", "install", "npx"]),
};

function tokenizeLine(line: string, lang: Lang): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;
  while (i < line.length) {
    // Comments
    if ((lang === "python" || lang === "bash") && line[i] === "#") {
      tokens.push({ text: line.slice(i), className: "text-text-muted" });
      break;
    }
    if (lang === "typescript" && line.slice(i, i + 2) === "//") {
      tokens.push({ text: line.slice(i), className: "text-text-muted" });
      break;
    }
    // Strings
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i];
      let end = i + 1;
      while (end < line.length && line[end] !== q) {
        if (line[end] === "\\") end++;
        end++;
      }
      end = Math.min(end + 1, line.length);
      tokens.push({ text: line.slice(i, end), className: "text-emerald-400" });
      i = end;
      continue;
    }
    // Words
    if (/[a-zA-Z_]/.test(line[i])) {
      let end = i;
      while (end < line.length && /[a-zA-Z0-9_]/.test(line[end])) end++;
      const word = line.slice(i, end);
      if (KEYWORDS[lang]?.has(word)) {
        tokens.push({ text: word, className: "text-purple-400" });
      } else {
        tokens.push({ text: word });
      }
      i = end;
      continue;
    }
    tokens.push({ text: line[i] });
    i++;
  }
  return tokens;
}

function HighlightedCode({ code, lang }: { code: string; lang: Lang }) {
  const lines = useMemo(
    () => code.split("\n").map((l) => tokenizeLine(l, lang)),
    [code, lang],
  );
  return (
    <div className="bg-[rgb(var(--basalt-deep))] rounded-lg p-4 overflow-x-auto">
      <pre className="text-sm font-mono leading-relaxed">
        <code>
          {lines.map((tokens, li) => (
            <span key={li}>
              {tokens.map((t, ti) => (
                <span key={ti} className={t.className}>{t.text}</span>
              ))}
              {li < lines.length - 1 && "\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SDK Data
// ---------------------------------------------------------------------------

interface SdkInfo {
  id: string;
  name: string;
  lang: Lang;
  icon: string;
  install: string;
  installLang: Lang;
  downloadUrl: string;
  filename: string;
  description: string;
  quickStart: string;
}

const SDKS: SdkInfo[] = [
  {
    id: "typescript",
    name: "TypeScript / Node.js",
    lang: "typescript",
    icon: "TS",
    install: `npm install --save-dev aaas-sdk\n# Or download directly:\ncurl -O https://aaas.blog/api/sdk/typescript`,
    installLang: "bash",
    downloadUrl: "/api/sdk/typescript",
    filename: "aaas-sdk.ts",
    description:
      "Full-featured TypeScript client with complete type definitions. Works with Node.js, Deno, Bun, and browser environments.",
    quickStart: `import { AaaSClient } from "./aaas-sdk";

const client = new AaaSClient({
  apiKey: "aaas_your_key_here",
});

// List all tools
const tools = await client.listEntities({ type: "tool", limit: 10 });
console.log(tools.data);

// Search for entities
const results = await client.search({ q: "langchain" });
console.log(results.data);

// Get leaderboard
const board = await client.getLeaderboard("all", 25);
console.log(board.data);

// Submit a new entity
const submission = await client.submitEntity({
  name: "My Tool",
  type: "tool",
  description: "An amazing AI tool",
  provider: "Acme Corp",
  category: "ai-tools",
  tags: ["ai", "automation"],
});
console.log(submission.id);`,
  },
  {
    id: "python",
    name: "Python",
    lang: "python",
    icon: "PY",
    install: `pip install requests\n# Download the SDK:\ncurl -O https://aaas.blog/api/sdk/python`,
    installLang: "bash",
    downloadUrl: "/api/sdk/python",
    filename: "aaas_sdk.py",
    description:
      "Python client using the requests library. Supports all API endpoints with typed method signatures and docstrings.",
    quickStart: `from aaas_sdk import AaaSClient

client = AaaSClient(api_key="aaas_your_key_here")

# List all tools
tools = client.list_entities(type="tool", limit=10)
print(f"Found {tools['count']} tools")

# Search for entities
results = client.search(q="langchain")
for entity in results["data"]:
    print(f"  {entity['name']} — {entity['scores']['composite']}")

# Get leaderboard
board = client.get_leaderboard("all", limit=25)
for i, entity in enumerate(board["data"], 1):
    print(f"  #{i} {entity['name']}")

# Submit a new entity
submission = client.submit_entity(
    name="My Tool",
    type="tool",
    description="An amazing AI tool",
    provider="Acme Corp",
    category="ai-tools",
    tags=["ai", "automation"],
)
print(f"Submitted: {submission['id']}")`,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SdksClient() {
  const [copied, setCopied] = useState<string | null>(null);

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-5xl">
          <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">
            Developer Tools
          </p>
          <h1 className="text-3xl font-bold text-text mb-4">SDKs</h1>
          <p className="text-text-muted leading-relaxed max-w-2xl">
            Official client libraries for the AaaS Knowledge Index API.
            Download a generated SDK or use the code examples below to get
            started.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-5xl space-y-10">
          {/* SDK cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {SDKS.map((sdk) => (
              <Card key={sdk.id} variant="glass" className="flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-circuit/10 border border-circuit/20 flex items-center justify-center">
                    <span className="text-sm font-mono font-bold text-circuit">
                      {sdk.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text">
                      {sdk.name}
                    </h3>
                    <p className="text-[10px] font-mono text-text-muted">
                      {sdk.filename}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-4 flex-1">
                  {sdk.description}
                </p>
                <a
                  href={sdk.downloadUrl}
                  download={sdk.filename}
                  className="inline-block"
                >
                  <Button variant="secondary" className="w-full">
                    Download {sdk.filename}
                  </Button>
                </a>
              </Card>
            ))}
          </div>

          {/* Per-SDK details */}
          {SDKS.map((sdk) => (
            <div key={sdk.id} id={sdk.id}>
              <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
                {sdk.name}
              </h2>

              {/* Installation */}
              <Card className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    Installation
                  </p>
                  <button
                    onClick={() => handleCopy(sdk.install, `install-${sdk.id}`)}
                    className="text-xs font-mono text-text-muted hover:text-circuit transition-colors"
                  >
                    {copied === `install-${sdk.id}` ? "Copied!" : "Copy"}
                  </button>
                </div>
                <HighlightedCode code={sdk.install} lang={sdk.installLang} />
              </Card>

              {/* Quick start */}
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    Quick Start
                  </p>
                  <button
                    onClick={() =>
                      handleCopy(sdk.quickStart, `quickstart-${sdk.id}`)
                    }
                    className="text-xs font-mono text-text-muted hover:text-circuit transition-colors"
                  >
                    {copied === `quickstart-${sdk.id}` ? "Copied!" : "Copy"}
                  </button>
                </div>
                <HighlightedCode code={sdk.quickStart} lang={sdk.lang} />
              </Card>
            </div>
          ))}

          {/* OpenAPI spec link */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center">
                <span className="text-sm font-mono font-bold text-text-muted">
                  {}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text">
                  OpenAPI Specification
                </h3>
                <p className="text-xs text-text-muted">
                  Machine-readable API specification (OpenAPI 3.0.3). Use with
                  Swagger UI, Postman, or any OpenAPI-compatible tool.
                </p>
              </div>
              <a href="/api/openapi" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">View Spec</Button>
              </a>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
