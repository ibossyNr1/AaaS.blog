# Carved Logic Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle the AaaS platform app with a monolithic basalt + circuit-glow design system, replacing the current multi-color accent approach with a monochromatic cyan-on-black aesthetic.

**Architecture:** Bottom-up token replacement — update CSS variables and Tailwind config first (foundation), then shared UI components (building blocks), then page-level components (visible output). Visual effects (grain, circuit grid, SVG paths) are added as new components/CSS.

**Tech Stack:** Next.js 14, Tailwind CSS 3.4, Framer Motion, React 18, TypeScript

---

### Task 1: Update Shared UI Design Tokens

**Files:**
- Modify: `packages/ui/src/globals.css`
- Modify: `packages/ui/tailwind.config.ts`

**Step 1: Replace CSS variables in globals.css**

Replace the entire `:root` block and utility classes in `packages/ui/src/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Basalt surfaces */
    --basalt-deep: #080809;
    --basalt-surface: #1a1a1c;
    --basalt-bright: #2a2a2e;
    --border: rgba(255, 255, 255, 0.05);

    /* Circuit accent */
    --circuit-glow: #00f3ff;
    --circuit-dim: rgba(0, 243, 255, 0.15);
    --accent-red: #ff2a6d;

    /* Text */
    --text: #e0e0e0;
    --text-muted: rgba(224, 224, 224, 0.5);

    /* Grain texture */
    --grain: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");

    --radius: 0.75rem;
  }

  * {
    border-color: var(--border);
  }

  body {
    background: var(--basalt-deep);
    color: var(--text);
    font-family: var(--font-geist-sans), system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Grain texture overlay */
  body::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: var(--grain);
    opacity: 0.04;
    pointer-events: none;
    z-index: 100;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .glow-circuit {
    box-shadow: 0 0 40px var(--circuit-dim);
  }

  .glow-red {
    box-shadow: 0 0 40px rgba(255, 42, 109, 0.15);
  }

  .text-glow {
    text-shadow: 0 0 10px var(--circuit-glow);
  }

  .monolith-title {
    background: linear-gradient(180deg, #fff 0%, #444 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}
```

**Step 2: Update Tailwind config**

Replace the entire content of `packages/ui/tailwind.config.ts` with:

```ts
import type { Config } from "tailwindcss";

const sharedConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        base: "var(--basalt-deep)",
        surface: {
          DEFAULT: "var(--basalt-surface)",
          bright: "var(--basalt-bright)",
        },
        border: "var(--border)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        circuit: {
          DEFAULT: "var(--circuit-glow)",
          dim: "var(--circuit-dim)",
        },
        "accent-red": "var(--accent-red)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "circuit-flow": "circuitFlow 10s linear infinite",
        "orb-pulse": "orbPulse 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        circuitFlow: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        orbPulse: {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 30px var(--circuit-dim)" },
          "50%": { transform: "scale(1.1)", boxShadow: "0 0 60px var(--circuit-glow)" },
        },
      },
    },
  },
};

export default sharedConfig;
```

**Step 3: Update platform globals.css**

Replace `apps/platform/src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Circuit grid background */
.circuit-grid {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(90deg, var(--basalt-surface) 1px, transparent 1px) 0 0 / 100px 100px,
    linear-gradient(var(--basalt-surface) 1px, transparent 1px) 0 0 / 100px 100px;
  mask-image: radial-gradient(circle at 50% 50%, black, transparent 80%);
  z-index: -1;
  opacity: 0.3;
  pointer-events: none;
}

/* Status card clip-path */
.card-carved {
  clip-path: polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%);
}
```

**Step 4: Update platform Tailwind config**

Replace `apps/platform/tailwind.config.ts` with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
```

**Step 5: Verify build compiles**

Run: `cd /Users/user/.gemini/AaaS && npm run build --workspace=apps/platform 2>&1 | tail -20`
Expected: Build succeeds (warnings OK, no errors)

**Step 6: Commit**

```bash
git add packages/ui/src/globals.css packages/ui/tailwind.config.ts apps/platform/src/app/globals.css apps/platform/tailwind.config.ts
git commit -m "feat: replace design tokens with Carved Logic basalt + circuit system"
```

---

### Task 2: Update Shared UI Components

**Files:**
- Modify: `packages/ui/src/button.tsx`
- Modify: `packages/ui/src/card.tsx`
- Modify: `packages/ui/src/badge.tsx`
- Modify: `packages/ui/src/section.tsx`
- Modify: `packages/ui/src/index.ts`

**Step 1: Rewrite Button component**

Replace entire `packages/ui/src/button.tsx`:

```tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "default" | "lg" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-transparent border border-text text-text font-mono uppercase tracking-[0.3rem] hover:bg-text hover:text-base hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-400",
  secondary:
    "bg-transparent border border-circuit text-circuit font-mono uppercase tracking-[0.2rem] hover:bg-circuit hover:text-base hover:shadow-[0_0_40px_var(--circuit-dim)] transition-all duration-400",
  ghost:
    "bg-transparent text-text-muted font-mono uppercase tracking-[0.1rem] hover:text-circuit hover:text-glow transition-all",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-12 px-6 text-sm",
  lg: "h-14 px-8 text-base",
  sm: "h-9 px-4 text-xs",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-circuit/50 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
```

**Step 2: Rewrite Card component**

Replace entire `packages/ui/src/card.tsx`:

```tsx
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  carved?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, carved = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] p-8 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "hover:-translate-y-2.5 hover:bg-[rgba(255,255,255,0.04)] hover:border-circuit",
          carved && "card-carved",
          className
        )}
        {...props}
      >
        {/* Circuit accent bar */}
        <div className="absolute top-0 left-0 w-10 h-0.5 bg-circuit shadow-[0_0_15px_var(--circuit-glow)]" />
        {props.children}
      </div>
    );
  }
);

Card.displayName = "Card";
```

**Step 3: Rewrite Badge component**

Replace entire `packages/ui/src/badge.tsx`:

```tsx
import { type HTMLAttributes } from "react";
import { cn } from "./cn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {}

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-xs font-mono uppercase tracking-wider",
        "text-circuit border border-circuit/20 bg-circuit/5",
        className
      )}
      {...props}
    />
  );
}
```

**Step 4: Update Section component**

Replace entire `packages/ui/src/section.tsx`:

```tsx
import { type HTMLAttributes } from "react";
import { cn } from "./cn";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: "default" | "surface";
}

export function Section({
  className,
  variant = "default",
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "py-24 px-6",
        variant === "surface" && "bg-surface",
        className
      )}
      {...props}
    />
  );
}
```

**Step 5: Update index.ts exports**

Replace `packages/ui/src/index.ts` — remove unused `accent` props from Card export:

```ts
export { Button } from "./button";
export { Card } from "./card";
export { Badge } from "./badge";
export { Section } from "./section";
export { Container } from "./container";
export { cn } from "./cn";
```

(No actual change needed — exports are the same, just the component APIs changed.)

**Step 6: Verify build**

Run: `cd /Users/user/.gemini/AaaS && npm run build --workspace=apps/platform 2>&1 | tail -20`
Expected: May have type errors in components that pass old props (accent, color). Fix in next tasks.

**Step 7: Commit**

```bash
git add packages/ui/src/button.tsx packages/ui/src/card.tsx packages/ui/src/badge.tsx packages/ui/src/section.tsx
git commit -m "feat: restyle shared UI components with Carved Logic aesthetic"
```

---

### Task 3: Update Layout with Circuit Background

**Files:**
- Modify: `apps/platform/src/app/layout.tsx`
- Create: `apps/platform/src/components/circuit-background.tsx`

**Step 1: Create CircuitBackground component**

Create `apps/platform/src/components/circuit-background.tsx`:

```tsx
export function CircuitBackground() {
  return (
    <>
      {/* Circuit grid */}
      <div className="circuit-grid" aria-hidden="true" />

      {/* Animated SVG circuit paths */}
      <svg
        className="fixed top-0 left-0 w-full h-full -z-10 opacity-20 pointer-events-none"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 0 100 H 200 V 300 H 400 V 100 H 600 V 500 H 1000"
          stroke="var(--circuit-glow)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          className="animate-circuit-flow"
        />
        <path
          d="M 1000 900 H 800 V 700 H 600 V 900 H 400 V 500 H 0"
          stroke="var(--circuit-glow)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          className="animate-circuit-flow"
          style={{ animationDelay: "3s" }}
        />
        <path
          d="M 200 0 V 400 H 400 V 600 H 200 V 1000"
          stroke="var(--circuit-glow)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          className="animate-circuit-flow"
          style={{ animationDelay: "6s" }}
        />
      </svg>
    </>
  );
}
```

**Step 2: Update layout.tsx**

Replace `apps/platform/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CircuitBackground } from "@/components/circuit-background";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Agent-as-a-Service | Carved Logic",
  description:
    "High-fidelity autonomous agents forged in basalt-grade reliability. Deploy scalable intelligence across private circuitry.",
  openGraph: {
    title: "Agent-as-a-Service",
    description: "Your Autonomous Digital Workforce",
    url: "https://agents-as-a-service.com",
    siteName: "Agent-as-a-Service",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <CircuitBackground />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

**Step 3: Commit**

```bash
git add apps/platform/src/components/circuit-background.tsx apps/platform/src/app/layout.tsx
git commit -m "feat: add circuit grid background and animated SVG paths"
```

---

### Task 4: Restyle Navbar

**Files:**
- Modify: `apps/platform/src/components/navbar.tsx`

**Step 1: Rewrite navbar**

Replace entire `apps/platform/src/components/navbar.tsx`:

```tsx
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
```

**Step 2: Commit**

```bash
git add apps/platform/src/components/navbar.tsx
git commit -m "feat: restyle navbar with monolith brand + monospace links"
```

---

### Task 5: Restyle Hero with Status Cards

**Files:**
- Modify: `apps/platform/src/components/hero.tsx`
- Delete: `apps/platform/src/components/agent-network.tsx` (replaced by status cards)

**Step 1: Rewrite Hero**

Replace entire `apps/platform/src/components/hero.tsx`:

```tsx
import { Button, Card, Container, Section } from "@aaas/ui";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const statusCards = [
  { label: "Processing Latency", value: "0.002ms" },
  { label: "Active Instances", value: "4,812 / \u221E" },
  { label: "Neural Density", value: "98.4%" },
];

export function Hero() {
  return (
    <Section className="relative pt-32 pb-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-circuit/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <Container className="relative z-10 max-w-[1600px]">
        <div className="relative">
          {/* Monolith Title */}
          <h1 className="monolith-title text-[clamp(4rem,12vw,10rem)] font-black leading-[0.85] tracking-[-0.04em] uppercase mb-8">
            CARVED<br />LOGIC
          </h1>

          <p className="max-w-lg text-lg text-text/70 font-light leading-relaxed">
            High-fidelity autonomous agents forged in basalt-grade reliability.
            Deploy scalable intelligence across private circuitry.
          </p>

          {/* Status Cards */}
          <div className="flex flex-col sm:flex-row gap-6 lg:gap-16 mt-16">
            {statusCards.map((card) => (
              <Card key={card.label} carved className="flex-1">
                <span className="font-mono text-[0.65rem] text-circuit uppercase tracking-wider block mb-4">
                  {card.label}
                </span>
                <span className="text-2xl font-medium text-text">
                  {card.value}
                </span>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 flex flex-wrap gap-4">
            <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="lg">Initialize System</Button>
            </a>
            <a href="/platform">
              <Button variant="secondary" size="lg">
                Explore Platform
              </Button>
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
}
```

**Step 2: Delete agent-network.tsx**

```bash
rm apps/platform/src/components/agent-network.tsx
```

**Step 3: Commit**

```bash
git add apps/platform/src/components/hero.tsx
git add -u apps/platform/src/components/agent-network.tsx
git commit -m "feat: restyle hero with monolith title + status cards, remove agent network"
```

---

### Task 6: Restyle ValueStrip

**Files:**
- Modify: `apps/platform/src/components/value-strip.tsx`

**Step 1: Rewrite ValueStrip**

Replace entire `apps/platform/src/components/value-strip.tsx`:

```tsx
import { Badge, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";

export function ValueStrip() {
  return (
    <Section variant="surface">
      <Container className="text-center">
        <FadeUp>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Badge>Context Engineering</Badge>
            <Badge>Tool Connectivity</Badge>
            <Badge>Agentic Work</Badge>
          </div>
          <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            AaaS transforms your business strategy into structured context that
            powers a continuously evolving network of AI agents — so they
            actually understand your business.
          </p>
        </FadeUp>
      </Container>
    </Section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/platform/src/components/value-strip.tsx
git commit -m "feat: restyle ValueStrip with circuit-glow badges"
```

---

### Task 7: Restyle ThreePillars

**Files:**
- Modify: `apps/platform/src/components/three-pillars.tsx`

**Step 1: Rewrite ThreePillars**

Replace entire `apps/platform/src/components/three-pillars.tsx`:

```tsx
import { Card, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";
import Link from "next/link";

const pillars = [
  {
    title: "Context Engineering",
    description:
      "Turn strategy docs, brand guides, and domain knowledge into structured, machine-readable context. Your agents understand your business — not just generic prompts.",
    link: "/platform#context",
  },
  {
    title: "Connect Any Tool",
    description:
      "MCPs, APIs, GitHub, Slack, databases — agents use your full toolchain. No walled gardens, no vendor lock-in. Your stack, amplified.",
    link: "/platform#tools",
  },
  {
    title: "Execute Autonomously",
    description:
      "Agents complete complex tasks end-to-end, learning from every cycle. From market research to outreach to compliance — they handle the work.",
    link: "/platform#execute",
  },
];

export function ThreePillars() {
  return (
    <Section>
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => (
            <FadeUp key={pillar.title} delay={i * 0.1}>
              <Card className="h-full flex flex-col">
                <h3 className="text-xl font-semibold text-text mb-3">
                  {pillar.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed flex-grow">
                  {pillar.description}
                </p>
                <Link
                  href={pillar.link}
                  className="mt-6 text-sm font-mono uppercase tracking-wider text-circuit hover:text-glow transition-all"
                >
                  Learn more →
                </Link>
              </Card>
            </FadeUp>
          ))}
        </div>
      </Container>
    </Section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/platform/src/components/three-pillars.tsx
git commit -m "feat: restyle ThreePillars with basalt cards + circuit accents"
```

---

### Task 8: Restyle ProcessStepper

**Files:**
- Modify: `apps/platform/src/components/process-stepper.tsx`

**Step 1: Rewrite ProcessStepper**

Replace entire `apps/platform/src/components/process-stepper.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Container, Section, cn } from "@aaas/ui";
import { FadeUp } from "./motion";

const steps = [
  {
    number: "01",
    title: "Define",
    heading: "Establish Your Strategic Foundations",
    description:
      "We map your vision, mission, values, target audience, competitive landscape, and strategic goals. This becomes the foundation that every agent references.",
  },
  {
    number: "02",
    title: "Structure",
    heading: "Convert Knowledge to Machine-Readable Data",
    description:
      "Qualitative business knowledge gets transformed into structured JSON context — brand voice, customer personas, product specs, market positioning. Agents consume this natively.",
  },
  {
    number: "03",
    title: "Create",
    heading: "Generate With Full Context",
    description:
      "Agents produce marketing copy, sales materials, research reports, outreach sequences, and more — all grounded in your actual business context, not generic outputs.",
  },
  {
    number: "04",
    title: "Iterate",
    heading: "Continuously Improve Through Insights",
    description:
      "Every agent interaction feeds back into the context layer. Agents identify patterns, surface opportunities, and refine their approach. Your digital workforce gets smarter every day.",
  },
];

export function ProcessStepper() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <Section variant="surface">
      <Container>
        <FadeUp>
          <h2 className="monolith-title text-3xl md:text-4xl font-bold text-center mb-16 uppercase tracking-tight">
            How It Works
          </h2>
        </FadeUp>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => setActiveStep(i)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 transition-all font-mono",
                  i === activeStep
                    ? "text-circuit text-glow"
                    : "text-text-muted hover:text-text"
                )}
              >
                <span className="text-sm font-bold">{step.number}</span>
                <span className="hidden sm:inline text-xs uppercase tracking-wider">
                  {step.title}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 md:w-16 h-px mx-1",
                    i < activeStep ? "bg-circuit" : "bg-[rgba(255,255,255,0.05)]"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Active step content */}
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-semibold text-text mb-4">
            {steps[activeStep].heading}
          </h3>
          <p className="text-text-muted leading-relaxed">
            {steps[activeStep].description}
          </p>
        </div>
      </Container>
    </Section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/platform/src/components/process-stepper.tsx
git commit -m "feat: restyle ProcessStepper with monospace circuit indicators"
```

---

### Task 9: Restyle UseCases

**Files:**
- Modify: `apps/platform/src/components/use-cases.tsx`

**Step 1: Rewrite UseCases**

Replace entire `apps/platform/src/components/use-cases.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button, Container, Section, cn } from "@aaas/ui";
import { FadeUp } from "./motion";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const cases = [
  {
    label: "Startups",
    headline: "Replace 5 SaaS tools with one agentic workforce.",
    body: "From market research to outreach to financial modeling — agents handle it. Get the operational capacity of a 10-person team without the headcount.",
  },
  {
    label: "SMBs",
    headline: "Scale operations without scaling costs.",
    body: "Automate repetitive workflows, generate reports, manage compliance, and execute marketing campaigns — all contextualized to your business.",
  },
  {
    label: "Consultants",
    headline: "Deliver 10x more value to every client.",
    body: "Deploy agent workflows for each client engagement. Research, analysis, and deliverable generation — done in hours, not weeks.",
  },
  {
    label: "Corporate Innovation",
    headline: "Prototype and validate at startup speed.",
    body: "Innovation departments use AaaS to rapidly test new initiatives with dedicated agent teams. From concept to proof-of-concept in days.",
  },
  {
    label: "Universities",
    headline: "Teach entrepreneurship with real AI infrastructure.",
    body: "Students build and run ventures on AaaS. Real agents, real tools, real market execution — the ultimate learning-by-doing platform.",
  },
];

export function UseCases() {
  const [active, setActive] = useState(0);

  return (
    <Section>
      <Container>
        <FadeUp>
          <h2 className="monolith-title text-3xl md:text-4xl font-bold text-center mb-12 uppercase tracking-tight">
            Built For Your World
          </h2>
        </FadeUp>

        {/* Tabs — monolith style */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {cases.map((c, i) => (
            <button
              key={c.label}
              onClick={() => setActive(i)}
              className={cn(
                "px-4 py-2 text-sm font-mono uppercase tracking-wider transition-all duration-300 border",
                i === active
                  ? "border-circuit text-circuit bg-circuit/5 shadow-[0_0_15px_var(--circuit-dim)]"
                  : "border-[rgba(255,255,255,0.05)] text-text-muted hover:text-text hover:border-text/20"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-semibold text-text mb-4">
            {cases[active].headline}
          </h3>
          <p className="text-text-muted leading-relaxed mb-8">
            {cases[active].body}
          </p>
          <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
            <Button>Book a Call</Button>
          </a>
        </div>
      </Container>
    </Section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/platform/src/components/use-cases.tsx
git commit -m "feat: restyle UseCases with monolith tab buttons"
```

---

### Task 10: Restyle MetricsStrip

**Files:**
- Modify: `apps/platform/src/components/metrics-strip.tsx`

**Step 1: Rewrite MetricsStrip**

Replace entire `apps/platform/src/components/metrics-strip.tsx`:

```tsx
import { Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";

const metrics = [
  { value: "12+", label: "Active Agents" },
  { value: "142k+", label: "Skill Calls" },
  { value: "4", label: "Live Projects" },
  { value: "4,200+", label: "Vault Entries" },
];

export function MetricsStrip() {
  return (
    <Section variant="surface" className="py-16">
      <Container>
        <FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="text-3xl md:text-4xl font-bold font-mono text-circuit">
                  {m.value}
                </div>
                <div className="font-mono text-xs uppercase tracking-wider text-text-muted mt-2">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/platform/src/components/metrics-strip.tsx
git commit -m "feat: restyle MetricsStrip with circuit-glow monospace values"
```

---

### Task 11: Restyle CTABlock

**Files:**
- Modify: `apps/platform/src/components/cta-block.tsx`

**Step 1: Rewrite CTABlock**

Replace entire `apps/platform/src/components/cta-block.tsx`:

```tsx
import { Button, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

export function CTABlock() {
  return (
    <Section className="relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-circuit/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />

      <Container className="relative z-10 text-center">
        <FadeUp>
          <h2 className="monolith-title text-3xl md:text-5xl font-bold mb-6 uppercase tracking-tight">
            Ready to deploy your autonomous workforce?
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="lg">Initialize System</Button>
            </a>
            <a href="/vault">
              <Button variant="secondary" size="lg">
                Explore the Vault
              </Button>
            </a>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
```

**Step 2: Commit**

```bash
git add apps/platform/src/components/cta-block.tsx
git commit -m "feat: restyle CTABlock with monolith buttons + circuit glow"
```

---

### Task 12: Restyle Footer

**Files:**
- Modify: `apps/platform/src/components/footer.tsx`

**Step 1: Rewrite Footer**

Replace entire `apps/platform/src/components/footer.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  Platform: [
    { label: "Platform", href: "/platform" },
    { label: "How it works", href: "/platform#how-it-works" },
  ],
  Pricing: [
    { label: "Retainer", href: "/pricing#retainer" },
    { label: "Pay-per-task", href: "/pricing#pay-per-task" },
    { label: "Build with AaaS", href: "/pricing#build" },
  ],
  Projects: [{ label: "Enora.ai", href: "/projects#enora" }],
  Vault: [
    { label: "Browse", href: "/vault" },
    { label: "Search", href: "/vault#search" },
  ],
  Collaborate: [
    { label: "Invest", href: "/collaborate#invest" },
    { label: "Co-innovate", href: "/collaborate#co-innovate" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.05)] bg-base py-16 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-1743338608-800f1.firebasestorage.app/o/Logos%2FAaaS.Points.png?alt=media"
                alt="AaaS"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="font-mono text-xs uppercase tracking-widest text-text">
                AaaS
              </span>
            </Link>
            <p className="font-mono text-xs text-text-muted uppercase tracking-wider">
              Autonomous Digital Workforce
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-mono text-xs font-medium text-circuit uppercase tracking-wider mb-3">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-mono text-xs text-text-muted hover:text-circuit hover:text-glow transition-all"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 font-mono text-xs text-text-muted">
            <a
              href="https://aaas.blog"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-circuit transition-colors"
            >
              Blog
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-circuit transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-circuit transition-colors"
            >
              GitHub
            </a>
          </div>
          <p className="font-mono text-xs text-text-muted">
            SYS_LOG: &copy; {new Date().getFullYear()} Agent-as-a-Service // UPTIME: 99.9999992%
          </p>
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Commit**

```bash
git add apps/platform/src/components/footer.tsx
git commit -m "feat: restyle footer with monolith basalt aesthetic"
```

---

### Task 13: Final Build Verification

**Step 1: Full build**

Run: `cd /Users/user/.gemini/AaaS && npm run build --workspace=apps/platform 2>&1 | tail -30`
Expected: Build succeeds with no errors

**Step 2: Fix any remaining type errors**

Check for any remaining references to removed props (`accent`, `color` on Card/Badge) in subpages and fix them.

**Step 3: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix: resolve remaining type errors from design token migration"
```
