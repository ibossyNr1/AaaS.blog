"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container, Section, Card, Badge } from "@aaas/ui";
import { EntityCard } from "@/components/entity-card";
import { getChannelName } from "@/lib/channels";
import type { Entity } from "@/lib/types";
import type { Persona } from "@/lib/types";
import { PERSONAS } from "@/lib/types";

const STORAGE_KEY = "aaas-persona";

const PERSONA_KEYS = Object.keys(PERSONAS) as Persona[];

interface DashboardClientProps {
  entities: Entity[];
}

export function DashboardClient({ entities }: DashboardClientProps) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as Persona | null;
    if (stored && stored in PERSONAS) {
      setPersona(stored);
    }
  }, []);

  function selectPersona(p: Persona) {
    setPersona(p);
    localStorage.setItem(STORAGE_KEY, p);
  }

  const personaChannels = persona ? PERSONAS[persona].channels : [];

  const recommended = persona
    ? entities.filter((e) => personaChannels.includes(e.category))
    : [];
  const others = persona
    ? entities.filter((e) => !personaChannels.includes(e.category))
    : entities;

  return (
    <>
      {/* Persona Selector */}
      <Section className="py-8">
        <Container className="max-w-6xl">
          <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-4">
            Select your persona
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {PERSONA_KEYS.map((key) => {
              const info = PERSONAS[key];
              const isSelected = persona === key;
              return (
                <button
                  key={key}
                  onClick={() => selectPersona(key)}
                  className="text-left"
                >
                  <Card
                    className={`h-full transition-colors ${
                      isSelected
                        ? "border-circuit ring-1 ring-circuit/30"
                        : "hover:border-text-muted/30"
                    }`}
                  >
                    <h3
                      className={`text-sm font-semibold mb-1 ${
                        isSelected ? "text-circuit" : "text-text"
                      }`}
                    >
                      {info.label}
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {info.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {info.channels.map((ch) => (
                        <span
                          key={ch}
                          className="text-[10px] font-mono text-text-muted bg-surface px-1.5 py-0.5 rounded"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Recommended for You */}
      {mounted && persona && recommended.length > 0 && (
        <Section className="py-8">
          <Container className="max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text">
                Recommended for You
              </h2>
              <Badge variant="circuit">{PERSONAS[persona].label}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommended.map((entity) => (
                <EntityCard
                  key={`${entity.type}-${entity.slug}`}
                  entity={entity}
                />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Followed Channels */}
      {mounted && persona && (
        <Section variant="surface" className="py-8">
          <Container className="max-w-6xl">
            <h2 className="text-xl font-semibold text-text mb-4">
              Followed Channels
            </h2>
            <div className="flex flex-wrap gap-3">
              {personaChannels.map((ch) => (
                <Link key={ch} href={`/channel/${ch}`}>
                  <Card className="px-4 py-3 cursor-pointer hover:border-circuit transition-colors">
                    <span className="text-sm font-semibold text-text">
                      {getChannelName(ch)}
                    </span>
                    <span className="text-xs font-mono text-text-muted ml-2">
                      /{ch}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* All Entities / Remaining */}
      {others.length > 0 && (
        <Section className="py-12">
          <Container className="max-w-6xl">
            <h2 className="text-xl font-semibold text-text mb-6">
              {persona ? "All Entities" : "Trending Entities"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {others.map((entity) => (
                <EntityCard
                  key={`${entity.type}-${entity.slug}`}
                  entity={entity}
                />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Empty state when no persona selected */}
      {mounted && !persona && (
        <Section variant="surface" className="py-12">
          <Container className="max-w-3xl text-center">
            <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">
              SYS_LOG: No persona selected
            </p>
            <p className="text-text-muted">
              Choose a persona above to unlock personalized recommendations
              tailored to your role.
            </p>
          </Container>
        </Section>
      )}
    </>
  );
}
