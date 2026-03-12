"use client";

import { useState, useRef, useEffect } from "react";
import { Container, Section } from "@aaas/ui";
import { useAuth } from "@/lib/auth-context";
import { PERSONAS } from "@/lib/types";
import type { Persona } from "@/lib/types";

const PERSONA_ICONS: Record<Persona, string> = {
  developer: "\u2328\uFE0F",
  researcher: "\uD83D\uDD2C",
  executive: "\uD83D\uDCC8",
  "agent-builder": "\uD83E\uDD16",
  enterprise: "\uD83C\uDFE2",
};

export function PersonaBanner() {
  const { user, loading, setPersona } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  if (loading || !user || !user.persona) return null;

  const currentPersona = user.persona;
  const personaInfo = PERSONAS[currentPersona];
  const icon = PERSONA_ICONS[currentPersona];

  async function handleSwitch(persona: Persona) {
    if (persona === currentPersona) {
      setDropdownOpen(false);
      return;
    }
    setSaving(true);
    await setPersona(persona);
    setSaving(false);
    setDropdownOpen(false);
  }

  return (
    <Section className="py-3 border-b border-border">
      <Container className="max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg" role="img" aria-label={personaInfo.label}>
              {icon}
            </span>
            <span className="text-sm text-text">
              Welcome back, <span className="font-semibold">{user.displayName ?? "User"}</span>
            </span>
            <span className="text-xs text-text-muted font-mono">
              {personaInfo.label} view
            </span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              disabled={saving}
              className="text-xs font-mono text-circuit hover:underline disabled:opacity-50"
            >
              {saving ? "Saving..." : "Switch persona"}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-base border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                {(Object.entries(PERSONAS) as [Persona, typeof PERSONAS[Persona]][]).map(
                  ([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleSwitch(key)}
                      className={`w-full text-left px-4 py-3 hover:bg-surface transition-colors ${
                        key === currentPersona ? "bg-surface" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span role="img" aria-label={config.label}>
                          {PERSONA_ICONS[key]}
                        </span>
                        <span className="text-sm font-medium text-text">{config.label}</span>
                        {key === currentPersona && (
                          <span className="text-[10px] font-mono text-circuit ml-auto">active</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5 ml-7">{config.description}</p>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
