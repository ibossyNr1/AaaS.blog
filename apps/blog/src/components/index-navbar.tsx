"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@aaas/ui";

const navLinks = [
  { label: "Explore", href: "/explore" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Listen", href: "/listen" },
  { label: "Submit", href: "/submit" },
  { label: "Dashboard", href: "/me" },
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
      <header className="fixed top-0 w-full z-50 bg-base/60 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight text-text">AaaS</span>
            <span className="text-text-muted font-mono text-xs">.index</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-text-muted hover:text-text transition-colors">{link.label}</Link>
            ))}
            <div className="w-px h-4 bg-border" />
            {channelLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs font-mono text-text-muted hover:text-circuit transition-colors">{link.label}</Link>
            ))}
            <div className="w-px h-4 bg-border" />
            <a href="https://agents-as-a-service.com" target="_blank" rel="noopener noreferrer" className="text-sm text-circuit hover:underline">Platform →</a>
          </nav>
          <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            <span className={cn("block w-5 h-0.5 bg-text transition-transform", mobileOpen && "rotate-45 translate-y-2")} />
            <span className={cn("block w-5 h-0.5 bg-text transition-opacity", mobileOpen && "opacity-0")} />
            <span className={cn("block w-5 h-0.5 bg-text transition-transform", mobileOpen && "-rotate-45 -translate-y-2")} />
          </button>
        </div>
      </header>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-base/95 backdrop-blur-xl pt-20 px-6 md:hidden">
          <nav className="flex flex-col gap-4">
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
          </nav>
        </div>
      )}
    </>
  );
}
