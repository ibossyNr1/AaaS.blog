"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, Badge, cn } from "@aaas/ui";
import type { AIQueryResult, ConversationMessage, EntityReference } from "@/lib/ai-query";

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="w-2 h-2 rounded-full bg-circuit/60 animate-pulse" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 rounded-full bg-circuit/60 animate-pulse" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 rounded-full bg-circuit/60 animate-pulse" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function EntityRefCard({ entity }: { entity: EntityReference }) {
  return (
    <Link href={`/${entity.type}/${entity.slug}`}>
      <Card className="p-3 hover:border-circuit/40 transition-colors cursor-pointer inline-block">
        <div className="flex items-center gap-2">
          <Badge variant="circuit" className="text-[10px]">
            {entity.type}
          </Badge>
          <span className="text-sm font-medium text-text">{entity.name}</span>
          {entity.relevance > 0.7 && (
            <span className="text-[10px] font-mono text-circuit">
              {Math.round(entity.relevance * 100)}%
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}

function MessageBubble({
  message,
  entities,
}: {
  message: ConversationMessage;
  entities?: EntityReference[];
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-circuit/15 text-text border border-circuit/20"
            : "bg-surface text-text border border-border",
        )}
      >
        {/* Render markdown-like content */}
        <div className="whitespace-pre-wrap">
          {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} className="font-semibold text-text">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>

        {/* Referenced entities */}
        {entities && entities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {entities.slice(0, 5).map((entity) => (
              <EntityRefCard key={`${entity.type}-${entity.slug}`} entity={entity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FollowUpChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (query: string) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className="text-xs px-3 py-1.5 rounded-full border border-circuit/20 text-circuit hover:bg-circuit/10 transition-colors font-mono"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main AI Search component                                           */
/* ------------------------------------------------------------------ */

interface AISearchProps {
  exampleQueries?: string[];
}

export function AISearch({ exampleQueries }: AISearchProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Fetch suggestions on input change
  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ai/suggest?q=${encodeURIComponent(input)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.data ?? []);
        }
      } catch {
        // Ignore suggestion failures
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [input]);

  const sendQuery = useCallback(
    async (queryText: string) => {
      if (!queryText.trim() || isLoading) return;

      setError(null);
      setSuggestions([]);
      setFollowUps([]);

      const userMessage: ConversationMessage = {
        role: "user",
        content: queryText.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const conversationHistory = [...messages, userMessage].slice(-10);

        const res = await fetch("/api/ai/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: queryText.trim(),
            conversationHistory,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(err.error || `Request failed (${res.status})`);
        }

        const result: AIQueryResult & { timestamp: string } = await res.json();

        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: result.answer,
          timestamp: result.timestamp,
          entities: result.entities,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setFollowUps(result.suggestedFollowUps ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery(input);
    }
  };

  const isEmpty = messages.length === 0;

  const defaultExamples = exampleQueries ?? [
    "Compare the top 3 AI coding assistants",
    "What's the best vector database for production use?",
    "Show me trending models this week",
    "Which tools integrate with LangChain?",
  ];

  return (
    <Card variant="glass" className="flex flex-col h-[600px] max-h-[80vh]">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmpty && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div>
              <div className="w-12 h-12 rounded-full bg-circuit/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-circuit"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text mb-1">
                Ask the Index
              </h2>
              <p className="text-sm text-text-muted max-w-md">
                Ask questions in natural language about AI tools, models, agents, and more.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {defaultExamples.map((example) => (
                <button
                  key={example}
                  onClick={() => sendQuery(example)}
                  className="text-xs px-3 py-2 rounded-lg border border-border text-text-muted hover:text-circuit hover:border-circuit/30 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} entities={msg.entities} />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-2xl">
              <TypingIndicator />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">
              {error}
            </div>
          </div>
        )}

        {!isLoading && followUps.length > 0 && (
          <FollowUpChips suggestions={followUps} onSelect={sendQuery} />
        )}
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && input.length >= 2 && (
        <div className="border-t border-border bg-surface px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s);
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
                className="text-xs px-2 py-1 rounded border border-border text-text-muted hover:text-circuit hover:border-circuit/30 transition-colors truncate max-w-[200px]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border p-3 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about AI tools, models, agents..."
          className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none px-2"
          disabled={isLoading}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            input.trim() && !isLoading
              ? "bg-circuit text-base hover:bg-circuit/90"
              : "bg-surface text-text-muted cursor-not-allowed",
          )}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </Card>
  );
}
