"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CHANNELS } from "@/lib/channels";
import { Card, Button, Badge, Section, Container, cn } from "@aaas/ui";
import type { Persona } from "@/lib/types";

const PERSONAS: { value: Persona; label: string; description: string }[] = [
  { value: "developer", label: "Developer", description: "Code-first, SDK docs, integrations" },
  { value: "researcher", label: "Researcher", description: "Papers, benchmarks, evaluations" },
  { value: "executive", label: "Executive", description: "Strategy, ROI, market trends" },
  { value: "agent-builder", label: "Agent Builder", description: "Multi-agent systems, orchestration" },
  { value: "enterprise", label: "Enterprise", description: "Compliance, governance, deployment" },
];

const DIGEST_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "none", label: "None" },
] as const;

type DigestFrequency = (typeof DIGEST_OPTIONS)[number]["value"];

interface UserSettings {
  persona: Persona;
  followedChannels: string[];
  digestFrequency: DigestFrequency;
}

export function SettingsClient() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    persona: "developer",
    followedChannels: [],
    digestFrequency: "weekly",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setSettings({
            persona: data.persona ?? "developer",
            followedChannels: data.followedChannels ?? [],
            digestFrequency: data.digestFrequency ?? "weekly",
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          persona: settings.persona,
          followedChannels: settings.followedChannels,
          digestFrequency: settings.digestFrequency,
        },
        { merge: true }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  }

  function toggleChannel(slug: string) {
    setSettings((prev) => ({
      ...prev,
      followedChannels: prev.followedChannels.includes(slug)
        ? prev.followedChannels.filter((c) => c !== slug)
        : [...prev.followedChannels, slug],
    }));
  }

  if (authLoading || loading) {
    return (
      <Section className="pt-32">
        <Container>
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-circuit border-t-transparent rounded-full animate-spin" />
          </div>
        </Container>
      </Section>
    );
  }

  if (!user) {
    return (
      <Section className="pt-32">
        <Container>
          <div className="max-w-lg mx-auto text-center py-24">
            <h1 className="text-2xl font-semibold text-text mb-4">Settings</h1>
            <p className="text-text-muted mb-8">Sign in to manage your preferences.</p>
            <Button variant="secondary" onClick={signIn}>
              Sign in with Google
            </Button>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section className="pt-32 pb-24">
      <Container>
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-text mb-1">Settings</h1>
            <p className="text-text-muted text-sm">
              Customize your Knowledge Index experience.
            </p>
          </div>

          {/* Persona */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-text mb-1">Persona</h2>
            <p className="text-sm text-text-muted mb-5">
              Your persona shapes content recommendations and default views.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PERSONAS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setSettings((s) => ({ ...s, persona: p.value }))}
                  className={cn(
                    "text-left rounded-lg border p-4 transition-all",
                    settings.persona === p.value
                      ? "border-circuit bg-circuit/5"
                      : "border-border hover:border-text-muted/40"
                  )}
                >
                  <span className="text-sm font-medium text-text">{p.label}</span>
                  {settings.persona === p.value && (
                    <Badge className="ml-2 text-[10px]">Active</Badge>
                  )}
                  <p className="text-xs text-text-muted mt-1">{p.description}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Channels */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-text mb-1">Channels</h2>
            <p className="text-sm text-text-muted mb-5">
              Follow channels to see their entities in your feed and digest.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {CHANNELS.map((ch) => {
                const active = settings.followedChannels.includes(ch.slug);
                return (
                  <button
                    key={ch.slug}
                    onClick={() => toggleChannel(ch.slug)}
                    className={cn(
                      "text-left rounded-lg border p-4 transition-all",
                      active
                        ? "border-circuit bg-circuit/5"
                        : "border-border hover:border-text-muted/40"
                    )}
                  >
                    <span className="text-sm font-medium text-text">{ch.name}</span>
                    {active && (
                      <Badge className="ml-2 text-[10px]">Following</Badge>
                    )}
                    <p className="text-xs text-text-muted mt-1 line-clamp-1">
                      {ch.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-text mb-1">Email Digest</h2>
            <p className="text-sm text-text-muted mb-5">
              Receive a summary of updates from your followed channels.
            </p>
            <div className="flex gap-3">
              {DIGEST_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setSettings((s) => ({ ...s, digestFrequency: opt.value }))
                  }
                  className={cn(
                    "rounded-lg border px-5 py-2.5 text-sm font-mono transition-all",
                    settings.digestFrequency === opt.value
                      ? "border-circuit bg-circuit/5 text-circuit"
                      : "border-border text-text-muted hover:border-text-muted/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Save */}
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            {saved && (
              <span className="text-sm text-circuit font-mono">Saved</span>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
