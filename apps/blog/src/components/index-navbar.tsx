"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@aaas/ui";
import { CommandPalette } from "./command-palette";
import { CommandPaletteTrigger } from "./command-palette-trigger";
import { NotificationBell } from "./notification-bell";
import { AuthButton } from "./auth-button";
import { LocaleSwitcher } from "./locale-switcher";

const navLinks = [
  { label: "Explore", href: "/explore" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Listen", href: "/listen" },
  { label: "Compare", href: "/compare" },
  { label: "Graph", href: "/graph" },
  { label: "Submit", href: "/submit" },
  { label: "Developers", href: "/developer" },
  { label: "Dashboard", href: "/me" },
  { label: "System", href: "/dashboard" },
  { label: "Stats", href: "/stats" },
  { label: "Activity", href: "/activity" },
  { label: "Digest", href: "/digest" },
  { label: "Changelog", href: "/changelog" },
  { label: "Comparisons", href: "/comparisons" },
  { label: "Status", href: "/status" },
  { label: "Analytics", href: "/analytics" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Media", href: "/media" },
  { label: "Workspaces", href: "/workspaces" },
  { label: "Collections", href: "/collections" },
  { label: "Bookmarks", href: "/bookmarks" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Following", href: "/following" },
  { label: "Profile", href: "/profile" },
  { label: "Events", href: "/events" },
  { label: "Webhooks", href: "/webhooks" },
  { label: "Integrations", href: "/integrations" },
  { label: "Achievements", href: "/achievements" },
  { label: "Vault", href: "/vault" },
  { label: "API Docs", href: "/api-docs" },
  { label: "Discover", href: "/discover" },
  { label: "Ask", href: "/ask" },
  { label: "Embed", href: "/embed" },
];

const channelLinks = [
  { label: "LLMs", href: "/channel/llms" },
  { label: "AI Tools", href: "/channel/ai-tools" },
  { label: "AI Agents", href: "/channel/ai-agents" },
  { label: "AI Code", href: "/channel/ai-code" },
];

export function IndexNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header role="banner" className="fixed top-0 w-full z-50 bg-base/60 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight text-text">AaaS</span>
            <span className="text-text-muted font-mono text-xs">.index</span>
          </Link>
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-text-muted hover:text-text transition-colors">{link.label}</Link>
            ))}
            <NotificationBell />
            <CommandPaletteTrigger />
            <AuthButton />
            <LocaleSwitcher />
            <div className="w-px h-4 bg-border" />
            {channelLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs font-mono text-text-muted hover:text-circuit transition-colors">{link.label}</Link>
            ))}
            <div className="w-px h-4 bg-border" />
            <a href="https://agents-as-a-service.com" target="_blank" rel="noopener noreferrer" className="text-sm text-circuit hover:underline">Platform →</a>
          </nav>
          <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
            <span className={cn("block w-5 h-0.5 bg-text transition-transform", mobileOpen && "rotate-45 translate-y-2")} />
            <span className={cn("block w-5 h-0.5 bg-text transition-opacity", mobileOpen && "opacity-0")} />
            <span className={cn("block w-5 h-0.5 bg-text transition-transform", mobileOpen && "-rotate-45 -translate-y-2")} />
          </button>
        </div>
      </header>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-base/95 backdrop-blur-xl pt-20 px-6 md:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="text-xl font-medium text-text">{link.label}</Link>
            ))}
            <div className="border-t border-border my-2" />
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Channels</span>
            {channelLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="text-lg text-text-muted">{link.label}</Link>
            ))}
            <div className="border-t border-border my-2" />
            <a href="https://agents-as-a-service.com" target="_blank" rel="noopener noreferrer" className="text-xl font-medium text-circuit">Platform →</a>
            <div className="border-t border-border my-2" />
            <LocaleSwitcher />
          </nav>
        </div>
      )}
      <CommandPalette />
    </>
  );
}
