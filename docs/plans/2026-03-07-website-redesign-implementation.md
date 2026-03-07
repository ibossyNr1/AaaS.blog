# AaaS Website Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full AaaS web presence across agents-as-a-service.com (platform) and aaas.blog (blog) as a monorepo with shared design system.

**Architecture:** Turborepo monorepo with two Next.js 14 apps (`apps/platform`, `apps/blog`) sharing a UI package (`packages/ui`) containing design tokens, Tailwind config, and component primitives. Each app deploys independently to Firebase App Hosting.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS 3.4, Framer Motion, shadcn/ui base, TypeScript, Geist/Geist Mono fonts, Firebase App Hosting.

**Design Doc:** `docs/plans/2026-03-07-website-redesign-design.md`

---

## Phase 1: Foundation (Tasks 1–5)

### Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json` (root workspace)
- Create: `turbo.json`
- Create: `apps/platform/` (move existing `frontend/` here)
- Create: `apps/blog/` (scaffold new Next.js app)
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Delete: `frontend/` (moved to `apps/platform/`)

**Step 1: Install Turborepo globally**

```bash
npm install -g turbo
```

**Step 2: Create root workspace package.json**

Create `package.json` at repo root:

```json
{
  "name": "aaas",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "dev:platform": "turbo dev --filter=platform",
    "dev:blog": "turbo dev --filter=blog",
    "build:platform": "turbo build --filter=platform",
    "build:blog": "turbo build --filter=blog"
  },
  "devDependencies": {
    "turbo": "^2"
  }
}
```

**Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Step 4: Move frontend/ to apps/platform/**

```bash
mkdir -p apps
mv frontend apps/platform
```

Update `apps/platform/package.json` — change `"name"` to `"platform"`.

**Step 5: Scaffold apps/blog/**

```bash
mkdir -p apps/blog
cd apps/blog
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

Update `apps/blog/package.json` — change `"name"` to `"blog"`.

**Step 6: Create packages/ui/ scaffold**

```bash
mkdir -p packages/ui/src
```

Create `packages/ui/package.json`:

```json
{
  "name": "@aaas/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./globals.css": "./src/globals.css",
    "./tailwind-config": "./tailwind.config.ts"
  },
  "scripts": {
    "lint": "eslint src/"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^3.4.1",
    "@types/react": "^18"
  },
  "peerDependencies": {
    "react": "^18"
  }
}
```

Create `packages/ui/tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "paths": {
      "@aaas/ui/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**Step 7: Install all dependencies from root**

```bash
cd /Users/user/.gemini/AaaS
npm install
```

**Step 8: Verify the build works**

```bash
turbo build --filter=platform
```

Expected: Build succeeds for the platform app.

**Step 9: Commit**

```bash
git add -A
git commit -m "chore: restructure to Turborepo monorepo with platform, blog, and shared UI package"
```

---

### Task 2: Design Tokens & Tailwind Config

**Files:**
- Create: `packages/ui/src/globals.css`
- Create: `packages/ui/tailwind.config.ts`
- Modify: `apps/platform/tailwind.config.ts`
- Modify: `apps/platform/src/app/globals.css`
- Modify: `apps/platform/src/app/layout.tsx`

**Step 1: Create the shared globals.css with CSS custom properties**

Create `packages/ui/src/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Base surfaces */
    --base: 223 84% 5%;
    --surface: 223 40% 8%;
    --surface-bright: 223 35% 15%;
    --border: 223 30% 20%;

    /* Text */
    --text: 220 20% 95%;
    --text-muted: 220 15% 60%;

    /* Accents */
    --blue: 205 100% 67%;
    --purple: 236 100% 80%;
    --green: 155 55% 62%;
    --pink: 345 75% 77%;
    --gold: 45 90% 72%;

    /* Functional */
    --ring: var(--blue);
    --radius: 0.75rem;
  }

  * {
    border-color: hsl(var(--border));
  }

  body {
    background: hsl(var(--base));
    color: hsl(var(--text));
    font-family: var(--font-geist-sans), system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .glow-blue {
    box-shadow: 0 0 40px hsl(var(--blue) / 0.15);
  }

  .glow-purple {
    box-shadow: 0 0 40px hsl(var(--purple) / 0.15);
  }

  .glow-green {
    box-shadow: 0 0 40px hsl(var(--green) / 0.15);
  }

  .glow-gold {
    box-shadow: 0 0 40px hsl(var(--gold) / 0.15);
  }

  .glow-pink {
    box-shadow: 0 0 40px hsl(var(--pink) / 0.15);
  }
}
```

**Step 2: Create the shared Tailwind config**

Create `packages/ui/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const sharedConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        base: "hsl(var(--base))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          bright: "hsl(var(--surface-bright))",
        },
        border: "hsl(var(--border))",
        text: {
          DEFAULT: "hsl(var(--text))",
          muted: "hsl(var(--text-muted))",
        },
        blue: {
          DEFAULT: "hsl(var(--blue))",
          glow: "hsl(var(--blue) / 0.15)",
          subtle: "hsl(var(--blue) / 0.08)",
        },
        purple: {
          DEFAULT: "hsl(var(--purple))",
          glow: "hsl(var(--purple) / 0.15)",
          subtle: "hsl(var(--purple) / 0.08)",
        },
        green: {
          DEFAULT: "hsl(var(--green))",
          glow: "hsl(var(--green) / 0.15)",
          subtle: "hsl(var(--green) / 0.08)",
        },
        pink: {
          DEFAULT: "hsl(var(--pink))",
          glow: "hsl(var(--pink) / 0.15)",
          subtle: "hsl(var(--pink) / 0.08)",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          glow: "hsl(var(--gold) / 0.15)",
          subtle: "hsl(var(--gold) / 0.08)",
        },
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
        "float": "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s ease-out forwards",
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
      },
    },
  },
};

export default sharedConfig;
```

**Step 3: Update platform's Tailwind config to extend shared config**

Replace `apps/platform/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";
import sharedConfig from "@aaas/ui/tailwind-config";

const config: Config = {
  presets: [sharedConfig as Config],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [],
};

export default config;
```

**Step 4: Replace platform's globals.css**

Replace `apps/platform/src/app/globals.css` with a single import:

```css
@import "@aaas/ui/globals.css";
```

**Step 5: Update platform's layout.tsx with correct metadata**

Replace `apps/platform/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
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
  title: "Agent-as-a-Service | Your Autonomous Digital Workforce",
  description:
    "Context-engineered AI agents that adapt, learn, and scale your business operations. Turn business strategy into structured data to perfect any AI request.",
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
        {children}
      </body>
    </html>
  );
}
```

**Step 6: Add @aaas/ui as dependency to platform**

In `apps/platform/package.json`, add to dependencies:

```json
"@aaas/ui": "workspace:*"
```

Then run `npm install` from root.

**Step 7: Verify build**

```bash
turbo build --filter=platform
```

Expected: Build succeeds with new design tokens active.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add shared design tokens, Tailwind config, and CSS variables for brand system"
```

---

### Task 3: Component Primitives

**Files:**
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/button.tsx`
- Create: `packages/ui/src/card.tsx`
- Create: `packages/ui/src/badge.tsx`
- Create: `packages/ui/src/section.tsx`
- Create: `packages/ui/src/container.tsx`
- Create: `packages/ui/src/cn.ts`

**Step 1: Create the cn utility**

Create `packages/ui/src/cn.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Add `clsx` and `tailwind-merge` as dependencies in `packages/ui/package.json`.

**Step 2: Create Button component**

Create `packages/ui/src/button.tsx`:

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
    "bg-blue text-white hover:brightness-110 glow-blue",
  secondary:
    "bg-transparent border border-border text-text hover:bg-surface-bright",
  ghost:
    "bg-transparent text-text-muted hover:text-text hover:bg-surface",
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
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/50 disabled:pointer-events-none disabled:opacity-50",
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

**Step 3: Create Card component**

Create `packages/ui/src/card.tsx`:

```tsx
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./cn";

type AccentColor = "blue" | "purple" | "green" | "pink" | "gold" | "none";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: AccentColor;
  hover?: boolean;
}

const accentBorders: Record<AccentColor, string> = {
  blue: "border-t-2 border-t-blue",
  purple: "border-t-2 border-t-purple",
  green: "border-t-2 border-t-green",
  pink: "border-t-2 border-t-pink",
  gold: "border-t-2 border-t-gold",
  none: "",
};

const accentGlows: Record<AccentColor, string> = {
  blue: "hover:glow-blue",
  purple: "hover:glow-purple",
  green: "hover:glow-green",
  pink: "hover:glow-pink",
  gold: "hover:glow-gold",
  none: "",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, accent = "none", hover = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl bg-surface border border-border p-8 backdrop-blur-sm transition-all duration-300",
          hover && "hover:scale-[1.02] hover:border-surface-bright",
          hover && accentGlows[accent],
          accentBorders[accent],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
```

**Step 4: Create Badge component**

Create `packages/ui/src/badge.tsx`:

```tsx
import { type HTMLAttributes } from "react";
import { cn } from "./cn";

type BadgeColor = "blue" | "purple" | "green" | "pink" | "gold";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

const colors: Record<BadgeColor, string> = {
  blue: "bg-blue-subtle text-blue border-blue/20",
  purple: "bg-purple-subtle text-purple border-purple/20",
  green: "bg-green-subtle text-green border-green/20",
  pink: "bg-pink-subtle text-pink border-pink/20",
  gold: "bg-gold-subtle text-gold border-gold/20",
};

export function Badge({ className, color = "blue", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border",
        colors[color],
        className
      )}
      {...props}
    />
  );
}
```

**Step 5: Create Section and Container layout components**

Create `packages/ui/src/section.tsx`:

```tsx
import { type HTMLAttributes } from "react";
import { cn } from "./cn";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: "default" | "surface" | "gradient";
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
        variant === "gradient" &&
          "bg-gradient-to-b from-base via-surface to-base",
        className
      )}
      {...props}
    />
  );
}
```

Create `packages/ui/src/container.tsx`:

```tsx
import { type HTMLAttributes } from "react";
import { cn } from "./cn";

export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("max-w-7xl mx-auto", className)} {...props} />
  );
}
```

**Step 6: Create barrel export**

Create `packages/ui/src/index.ts`:

```typescript
export { Button } from "./button";
export { Card } from "./card";
export { Badge } from "./badge";
export { Section } from "./section";
export { Container } from "./container";
export { cn } from "./cn";
```

**Step 7: Install shared dependencies**

```bash
cd packages/ui
npm install clsx tailwind-merge
```

**Step 8: Verify build**

```bash
cd /Users/user/.gemini/AaaS
turbo build --filter=platform
```

Expected: Build succeeds. Components importable as `import { Button } from "@aaas/ui"`.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add shared component primitives (Button, Card, Badge, Section, Container)"
```

---

### Task 4: Global Navbar

**Files:**
- Create: `apps/platform/src/components/navbar.tsx`
- Modify: `apps/platform/src/app/layout.tsx`

**Step 1: Create the Navbar component**

Create `apps/platform/src/components/navbar.tsx`:

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@aaas/ui";
import { cn } from "@aaas/ui";

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
      <header className="fixed top-0 w-full z-50 bg-base/60 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/studio-1743338608-800f1.firebasestorage.app/o/Logos%2FAaaS.Points.png?alt=media"
              alt="AaaS"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="font-semibold text-lg tracking-tight text-text">
              AaaS
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-text-muted hover:text-text transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button size="sm" asChild>
              <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
                Book a Call
              </a>
            </Button>
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
                className="text-2xl font-medium text-text animate-fade-up"
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
              <Button className="w-full" size="lg">
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

**Note:** The `Button` component uses `asChild` — you may need to adjust this to wrap the anchor tag differently depending on whether you add Radix Slot or just use a direct approach. Simplest: remove `asChild` and wrap the button in an anchor, or make Button accept an `href` prop.

**Step 2: Create the Footer component**

Create `apps/platform/src/components/footer.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

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
    <footer className="border-t border-border bg-base py-16 px-6">
      <div className="max-w-7xl mx-auto">
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
              <span className="font-semibold text-sm text-text">AaaS</span>
            </Link>
            <p className="text-xs text-text-muted">
              Your Autonomous Digital Workforce
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-text mb-3">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-text-muted hover:text-text transition-colors"
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
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <a
              href="https://aaas.blog"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text transition-colors"
            >
              Blog
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text transition-colors"
            >
              GitHub
            </a>
          </div>
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Agent-as-a-Service
          </p>
        </div>
      </div>
    </footer>
  );
}
```

**Step 3: Wire Navbar and Footer into layout.tsx**

Update `apps/platform/src/app/layout.tsx` — add `<Navbar />` and `<Footer />` inside the body:

```tsx
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

// ... (keep existing font/metadata code)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

**Step 4: Run dev to verify visually**

```bash
npm run dev:platform
```

Open `http://localhost:3000`. Verify: dark background, nav bar visible, footer at bottom, correct colors.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add global Navbar and Footer with navigation and booking CTA"
```

---

### Task 5: Install Framer Motion

**Files:**
- Modify: `apps/platform/package.json`
- Create: `apps/platform/src/components/motion.tsx`

**Step 1: Install Framer Motion**

```bash
cd apps/platform
npm install framer-motion
```

**Step 2: Create motion wrapper components**

Create `apps/platform/src/components/motion.tsx`:

```tsx
"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface FadeUpProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface CountUpProps {
  end: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUp({
  end,
  suffix = "",
  prefix = "",
  className,
}: CountUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
      >
        {isInView ? (
          <MotionNumber end={end} />
        ) : (
          "0"
        )}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

function MotionNumber({ end }: { end: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {end.toLocaleString()}
    </motion.span>
  );
}

export { motion };
```

**Step 3: Verify build**

```bash
turbo build --filter=platform
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Framer Motion with FadeUp and CountUp animation components"
```

---

## Phase 2: Platform Pages (Tasks 6–14)

### Task 6: Homepage — Hero Section

**Files:**
- Create: `apps/platform/src/components/hero.tsx`
- Create: `apps/platform/src/components/agent-network.tsx`
- Modify: `apps/platform/src/app/page.tsx`

**Step 1: Create the Agent Network canvas animation**

Create `apps/platform/src/components/agent-network.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  label: string;
  pulsePhase: number;
}

const AGENT_COLORS = [
  "#55b8ff", // blue
  "#939aff", // purple
  "#69d4a6", // green
  "#ef97b1", // pink
  "#f8d974", // gold
];

const AGENT_LABELS = [
  "Research",
  "Marketing",
  "Analytics",
  "Sales",
  "DevOps",
  "Strategy",
  "Outreach",
  "Compliance",
  "Content",
  "Finance",
];

export function AgentNetwork({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -1, y: -1 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Initialize nodes
    const rect = canvas.getBoundingClientRect();
    nodesRef.current = Array.from({ length: 10 }, (_, i) => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: 4 + Math.random() * 4,
      color: AGENT_COLORS[i % AGENT_COLORS.length],
      label: AGENT_LABELS[i],
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1, y: -1 };
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      const nodes = nodesRef.current;
      const t = Date.now() / 1000;

      // Update positions
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 20 || node.x > r.width - 20) node.vx *= -1;
        if (node.y < 20 || node.y > r.height - 20) node.vy *= -1;

        node.x = Math.max(20, Math.min(r.width - 20, node.x));
        node.y = Math.max(20, Math.min(r.height - 20, node.y));
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 180;

          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.3;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();

            // Traveling dot
            const dotProgress = ((t * 0.5 + i * 0.1) % 1);
            const dotX = nodes[i].x + (nodes[j].x - nodes[i].x) * dotProgress;
            const dotY = nodes[i].y + (nodes[j].y - nodes[i].y) * dotProgress;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 2})`;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw nodes
      const mouse = mouseRef.current;
      for (const node of nodes) {
        const pulse = Math.sin(t * 2 + node.pulsePhase) * 0.3 + 1;
        const isHovered =
          mouse.x > 0 &&
          Math.hypot(mouse.x - node.x, mouse.y - node.y) < 40;

        // Glow
        const glowRadius = (isHovered ? 30 : 20) * pulse;
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, glowRadius
        );
        gradient.addColorStop(0, node.color + "40");
        gradient.addColorStop(1, node.color + "00");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core
        const coreRadius = (isHovered ? node.radius * 1.5 : node.radius) * pulse;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        // Label on hover
        if (isHovered) {
          ctx.fillStyle = "#f0f2f5";
          ctx.font = "12px var(--font-geist-mono), monospace";
          ctx.textAlign = "center";
          ctx.fillText(node.label, node.x, node.y - 20);
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
```

**Step 2: Create Hero component**

Create `apps/platform/src/components/hero.tsx`:

```tsx
import { Button, Container, Section } from "@aaas/ui";
import { AgentNetwork } from "./agent-network";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

export function Hero() {
  return (
    <Section className="relative pt-32 pb-24 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-text leading-[1.1]">
              Your Autonomous{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue to-purple">
                Digital Workforce
              </span>
            </h1>
            <p className="mt-6 text-lg text-text-muted max-w-lg leading-relaxed">
              Context-engineered AI agents that adapt, learn, and scale your
              business operations. Turn strategy into structured intelligence
              that powers every decision.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <a
                  href={BOOKING_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book a Call
                </a>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <a href="/platform">Explore Platform →</a>
              </Button>
            </div>
          </div>

          {/* Right — Agent Network */}
          <div className="relative h-[400px] lg:h-[500px]">
            <AgentNetwork className="absolute inset-0 rounded-2xl" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
```

**Step 3: Replace page.tsx with Hero**

Replace `apps/platform/src/app/page.tsx`:

```tsx
import { Hero } from "@/components/hero";

export default function Home() {
  return <Hero />;
}
```

**Step 4: Run dev and verify**

```bash
npm run dev:platform
```

Expected: Hero section visible with animated agent network, gradient text, CTAs.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add homepage hero with animated agent network canvas"
```

---

### Task 7: Homepage — Value Proposition, Three Pillars, Process Stepper

**Files:**
- Create: `apps/platform/src/components/value-strip.tsx`
- Create: `apps/platform/src/components/three-pillars.tsx`
- Create: `apps/platform/src/components/process-stepper.tsx`
- Modify: `apps/platform/src/app/page.tsx`

**Step 1: Build ValueStrip**

Create `apps/platform/src/components/value-strip.tsx`:

```tsx
import { Badge, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";

export function ValueStrip() {
  return (
    <Section variant="surface">
      <Container className="text-center">
        <FadeUp>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Badge color="blue">Context Engineering</Badge>
            <Badge color="purple">Tool Connectivity</Badge>
            <Badge color="green">Agentic Work</Badge>
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

**Step 2: Build ThreePillars**

Create `apps/platform/src/components/three-pillars.tsx`:

```tsx
import { Card, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";
import Link from "next/link";

const pillars = [
  {
    accent: "blue" as const,
    title: "Context Engineering",
    description:
      "Turn strategy docs, brand guides, and domain knowledge into structured, machine-readable context. Your agents understand your business — not just generic prompts.",
    link: "/platform#context",
  },
  {
    accent: "purple" as const,
    title: "Connect Any Tool",
    description:
      "MCPs, APIs, GitHub, Slack, databases — agents use your full toolchain. No walled gardens, no vendor lock-in. Your stack, amplified.",
    link: "/platform#tools",
  },
  {
    accent: "green" as const,
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
              <Card accent={pillar.accent} className="h-full flex flex-col">
                <div
                  className={`w-10 h-10 rounded-lg mb-6 flex items-center justify-center bg-${pillar.accent}-subtle`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-${pillar.accent}`}
                  />
                </div>
                <h3 className="text-xl font-semibold text-text mb-3">
                  {pillar.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed flex-grow">
                  {pillar.description}
                </p>
                <Link
                  href={pillar.link}
                  className={`mt-6 text-sm font-medium text-${pillar.accent} hover:underline`}
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

**Step 3: Build ProcessStepper**

Create `apps/platform/src/components/process-stepper.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Container, Section } from "@aaas/ui";
import { cn } from "@aaas/ui";
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
          <h2 className="text-3xl md:text-4xl font-bold text-text text-center mb-16">
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
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                  i === activeStep
                    ? "text-blue"
                    : "text-text-muted hover:text-text"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-sm font-bold",
                    i === activeStep && "text-blue"
                  )}
                >
                  {step.number}
                </span>
                <span className="hidden sm:inline text-sm font-medium">
                  {step.title}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 md:w-16 h-px mx-1",
                    i < activeStep ? "bg-blue" : "bg-border"
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

**Step 4: Wire into page.tsx**

Update `apps/platform/src/app/page.tsx`:

```tsx
import { Hero } from "@/components/hero";
import { ValueStrip } from "@/components/value-strip";
import { ThreePillars } from "@/components/three-pillars";
import { ProcessStepper } from "@/components/process-stepper";

export default function Home() {
  return (
    <>
      <Hero />
      <ValueStrip />
      <ThreePillars />
      <ProcessStepper />
    </>
  );
}
```

**Step 5: Verify dev**

```bash
npm run dev:platform
```

Expected: Full homepage scrolls through Hero → Value Strip → Three Pillars → Process Stepper.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add homepage value strip, three pillars, and process stepper sections"
```

---

### Task 8: Homepage — Use Cases, Metrics, Final CTA

**Files:**
- Create: `apps/platform/src/components/use-cases.tsx`
- Create: `apps/platform/src/components/metrics-strip.tsx`
- Create: `apps/platform/src/components/cta-block.tsx`
- Modify: `apps/platform/src/app/page.tsx`

**Step 1: Build UseCases tab component**

Create `apps/platform/src/components/use-cases.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button, Container, Section } from "@aaas/ui";
import { cn } from "@aaas/ui";
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
          <h2 className="text-3xl md:text-4xl font-bold text-text text-center mb-12">
            Built For Your World
          </h2>
        </FadeUp>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {cases.map((c, i) => (
            <button
              key={c.label}
              onClick={() => setActive(i)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                i === active
                  ? "bg-gold text-base"
                  : "bg-surface text-text-muted hover:text-text border border-border"
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
          <Button asChild>
            <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
              Book a Call
            </a>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
```

**Step 2: Build MetricsStrip**

Create `apps/platform/src/components/metrics-strip.tsx`:

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
                <div className="text-3xl md:text-4xl font-bold font-mono text-text">
                  {m.value}
                </div>
                <div className="text-sm text-text-muted mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
```

**Step 3: Build CTABlock**

Create `apps/platform/src/components/cta-block.tsx`:

```tsx
import { Button, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

export function CTABlock() {
  return (
    <Section className="relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-blue/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-purple/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />

      <Container className="relative z-10 text-center">
        <FadeUp>
          <h2 className="text-3xl md:text-5xl font-bold text-text mb-6">
            Ready to build your autonomous workforce?
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <a
                href={BOOKING_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a Call
              </a>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <a href="/vault">Explore the Vault →</a>
            </Button>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
```

**Step 4: Complete page.tsx**

Update `apps/platform/src/app/page.tsx`:

```tsx
import { Hero } from "@/components/hero";
import { ValueStrip } from "@/components/value-strip";
import { ThreePillars } from "@/components/three-pillars";
import { ProcessStepper } from "@/components/process-stepper";
import { UseCases } from "@/components/use-cases";
import { MetricsStrip } from "@/components/metrics-strip";
import { CTABlock } from "@/components/cta-block";

export default function Home() {
  return (
    <>
      <Hero />
      <ValueStrip />
      <ThreePillars />
      <ProcessStepper />
      <UseCases />
      <MetricsStrip />
      <CTABlock />
    </>
  );
}
```

**Step 5: Verify**

```bash
npm run dev:platform
```

Expected: Complete homepage with all sections scrolling smoothly.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: complete homepage with use cases, metrics strip, and final CTA"
```

---

### Task 9: Pricing Page

**Files:**
- Create: `apps/platform/src/app/pricing/page.tsx`

**Step 1: Create the pricing page**

Create `apps/platform/src/app/pricing/page.tsx` with:

- Hero section (centered heading + subtitle)
- Three pricing cards (Retainer, Pay-per-Task with "Most Popular" badge, Build with AaaS)
- Comparison table
- FAQ accordion (4–6 items)
- CTA block

Use `Card`, `Badge`, `Button`, `Section`, `Container` from `@aaas/ui`. Use `FadeUp` for scroll animations.

Pricing cards should have NO prices shown — all CTAs are "Book a Call" linking to the Google Calendar.

Mark "Pay-per-Task" card with `--gold` accent and slightly larger scale via `className="scale-105"`.

**Step 2: Verify**

```bash
npm run dev:platform
```

Navigate to `/pricing`. Verify layout, card rendering, FAQ expand/collapse.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add pricing page with three proposition cards and comparison table"
```

---

### Task 10: Platform Page

**Files:**
- Create: `apps/platform/src/app/platform/page.tsx`
- Create: `apps/platform/src/components/evolution-loop.tsx`
- Create: `apps/platform/src/components/capability-grid.tsx`

**Step 1: Build EvolutionLoop component**

Animated circular flow: Scout → Evaluate → Integrate → Optimize with sequential accent highlighting and expand-on-click detail panels.

**Step 2: Build CapabilityGrid component**

6 cards (3×2): Research, Marketing, Analytics, Sales, Operations, Development. Each with accent-colored icon and expand-on-click detail.

**Step 3: Build platform page**

Assemble: Hero → Evolution Loop → Capability Grid → Adaptability Timeline → CTA Block.

**Step 4: Verify and commit**

```bash
git add -A
git commit -m "feat: add platform page with evolution loop and capability grid"
```

---

### Task 11: Projects Page

**Files:**
- Create: `apps/platform/src/app/projects/page.tsx`

**Step 1: Build projects page**

- Hero ("What We're Building")
- Featured Enora.ai card (large, `--blue` accent, glow, status badge)
- Other projects grid (smaller cards)
- Last card: "Your Project?" CTA linking to `/collaborate`

**Step 2: Verify and commit**

```bash
git add -A
git commit -m "feat: add projects page with featured Enora.ai card"
```

---

### Task 12: Vault Page

**Files:**
- Create: `apps/platform/src/app/vault/page.tsx`
- Create: `apps/platform/src/components/vault-search.tsx`
- Create: `apps/platform/src/components/vault-grid.tsx`

**Step 1: Build VaultSearch component**

Large centered search input with `--purple` focus glow. Category filter pills below.

**Step 2: Build VaultGrid component**

Card grid displaying vault entries. For the initial build, use static sample data extracted from `vault_ls.txt`. Each card shows: type badge, name, key metric, category tag.

**Step 3: Build vault page**

Hero → Search → Filter pills → Results grid → Stats strip → Load more.

**Step 4: Verify and commit**

```bash
git add -A
git commit -m "feat: add vault page with search, filters, and entry grid"
```

---

### Task 13: Collaborate Page

**Files:**
- Create: `apps/platform/src/app/collaborate/page.tsx`

**Step 1: Build collaborate page**

- Hero ("Build the Future With Us")
- Two large side-by-side cards: Invest (`--gold`) and Co-Innovate (`--green`)
- Equity model 3-step timeline
- CTA block

**Step 2: Verify and commit**

```bash
git add -A
git commit -m "feat: add collaborate page with invest and co-innovate tracks"
```

---

## Phase 3: Blog (Tasks 14–16)

### Task 14: Blog — Shared Design System Setup

**Files:**
- Modify: `apps/blog/package.json`
- Modify: `apps/blog/tailwind.config.ts`
- Modify: `apps/blog/src/app/globals.css`
- Modify: `apps/blog/src/app/layout.tsx`

**Step 1: Add @aaas/ui dependency to blog app**

Same setup as platform: extend shared Tailwind config, import shared globals.css, load Geist fonts.

**Step 2: Create blog-specific navbar**

Different from platform — shows "AaaS.blog" branding, Channels dropdown, Search, and cross-link to agents-as-a-service.com.

**Step 3: Verify and commit**

```bash
git add -A
git commit -m "feat: set up blog app with shared design system"
```

---

### Task 15: Blog — Home Page

**Files:**
- Create: `apps/blog/src/app/page.tsx`
- Create: `apps/blog/src/components/featured-post.tsx`
- Create: `apps/blog/src/components/channel-cards.tsx`
- Create: `apps/blog/src/components/post-grid.tsx`

**Step 1: Build featured post hero card**

Full-width card with agent author badge (accent-colored), title, date, read time.

**Step 2: Build agent channel cards**

Horizontal scroll of channel cards (Research, Marketing, DevOps, Strategy). Each shows agent name, accent color, post count.

**Step 3: Build latest posts grid**

3-column card grid with post title, excerpt, agent author badge, date, read time.

**Step 4: Assemble blog home page**

Featured Post → Agent Channels → Latest Posts.

Use static sample data for initial build. Content management (CMS integration) is a future task.

**Step 5: Verify and commit**

```bash
git add -A
git commit -m "feat: add blog home page with featured post, channels, and post grid"
```

---

### Task 16: Blog — Post Layout

**Files:**
- Create: `apps/blog/src/app/[slug]/page.tsx`
- Create: `apps/blog/src/components/post-layout.tsx`

**Step 1: Build post layout**

- Agent author card at top (accent color, name, description)
- Max-width 720px content column
- Table of contents sidebar on desktop (sticky)
- Related posts from same channel at bottom
- Cross-link CTA to agents-as-a-service.com

**Step 2: Create sample post for testing**

Static sample post with realistic content.

**Step 3: Verify and commit**

```bash
git add -A
git commit -m "feat: add blog post layout with agent author card and TOC sidebar"
```

---

## Phase 4: Polish & Deploy (Tasks 17–19)

### Task 17: SEO & Metadata

**Files:**
- Modify: `apps/platform/src/app/layout.tsx`
- Create: `apps/platform/src/app/sitemap.ts`
- Create: `apps/platform/src/app/robots.ts`
- Create per-page metadata exports in each page.tsx

**Step 1: Add per-page metadata**

Each page exports a `metadata` object with title, description, and Open Graph tags. Use Next.js built-in metadata API.

**Step 2: Create sitemap.ts and robots.ts**

Auto-generate sitemap from page routes. Robots allows all crawlers.

**Step 3: Verify and commit**

```bash
git add -A
git commit -m "feat: add SEO metadata, sitemap, and robots.txt"
```

---

### Task 18: Responsive Polish

**Files:**
- All component files

**Step 1: Audit all pages at mobile (375px), tablet (768px), desktop (1280px)**

Use browser dev tools or `npm run dev:platform` and resize.

**Step 2: Fix breakpoints**

- Hero: stack columns on mobile, reduce heading size
- Pricing cards: horizontal scroll on mobile
- Vault grid: 1 column mobile, 2 tablet
- All CTAs: full-width on mobile
- Nav: hamburger + overlay tested
- Agent network: reduce nodes on mobile (check via window width in canvas)

**Step 3: Commit**

```bash
git add -A
git commit -m "fix: responsive polish across all pages and breakpoints"
```

---

### Task 19: Firebase Deployment

**Files:**
- Create: `apps/platform/firebase.json` (or use `firebase init` with apphosting)
- Create: `apps/platform/apphosting.yaml`

**Step 1: Initialize Firebase App Hosting for platform**

```bash
cd apps/platform
firebase init apphosting --project <project-id>
```

Follow prompts to connect GitHub repo and configure build.

**Step 2: Create apphosting.yaml**

```yaml
runConfig:
  minInstances: 0
  maxInstances: 4
  memoryMiB: 512
  cpu: 1
env:
  - variable: NEXT_PUBLIC_BOOKING_URL
    value: "https://calendar.app.google/X2MjiFt1vkksn2ga8"
```

**Step 3: Deploy platform**

```bash
firebase apphosting:backends:create --project <project-id>
```

Or push to connected GitHub branch for auto-deploy.

**Step 4: Configure custom domain**

```bash
firebase apphosting:backends:update --custom-domain agents-as-a-service.com
```

**Step 5: Repeat for blog app** (deploy to aaas.blog domain)

**Step 6: Verify both sites live**

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Firebase App Hosting deployment config for platform and blog"
```

---

## Summary

| Phase | Tasks | Estimated Commits |
|-------|-------|-------------------|
| 1. Foundation | Tasks 1–5 | 5 |
| 2. Platform Pages | Tasks 6–13 | 8 |
| 3. Blog | Tasks 14–16 | 3 |
| 4. Polish & Deploy | Tasks 17–19 | 3 |
| **Total** | **19 tasks** | **~19 commits** |

### Build Order

Foundation must complete first. Within Phase 2, homepage tasks (6–8) are sequential. Pages 9–13 are independent and can be parallelized. Phase 3 depends on Phase 1 only. Phase 4 depends on everything.
