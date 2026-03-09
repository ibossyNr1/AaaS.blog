"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, cn } from "@aaas/ui";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const navItems = [
  { label: "Platform", href: "/platform" },
  { label: "Pricing", href: "/pricing" },
  { label: "Projects", href: "/projects" },
  { label: "Vault", href: "/vault" },
  { label: "Collaborate", href: "/collaborate" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-base/60 backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)]">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-16 h-20 flex items-center justify-between">
          {/* Brand — Monolith style */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/studio-1743338608-800f1.firebasestorage.app/o/Logos%2FAaaS.Points.png?alt=media"
              alt="AaaS"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="font-mono text-xs tracking-[0.5rem] uppercase text-text border-l-2 border-circuit pl-4">
              SYSTEM://AGENTS
            </span>
          </Link>

          {/* Desktop Nav — Monospace, dim-to-glow */}
          <nav className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-mono text-xs uppercase tracking-wider text-text/50 hover:text-circuit hover:text-glow transition-all duration-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary">Book a Call</Button>
            </a>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={cn(
                "block w-6 h-0.5 bg-text transition-transform",
                mobileOpen && "rotate-45 translate-y-2"
              )}
            />
            <span
              className={cn(
                "block w-6 h-0.5 bg-text transition-opacity",
                mobileOpen && "opacity-0"
              )}
            />
            <span
              className={cn(
                "block w-6 h-0.5 bg-text transition-transform",
                mobileOpen && "-rotate-45 -translate-y-2"
              )}
            />
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-base/95 backdrop-blur-xl pt-24 px-6 md:hidden">
          <nav className="flex flex-col gap-6">
            {navItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="font-mono text-lg uppercase tracking-wider text-text animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={BOOKING_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4"
            >
              <Button className="w-full" size="lg" variant="secondary">
                Book a Call
              </Button>
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
