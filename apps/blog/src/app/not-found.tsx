import Link from "next/link";
import { Container, Section, Button } from "@aaas/ui";

const POPULAR_PAGES = [
  { href: "/explore", label: "Explore entities" },
  { href: "/tool", label: "Tools" },
  { href: "/model", label: "Models" },
  { href: "/agent", label: "Agents" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/search", label: "Search" },
];

export default function NotFound() {
  return (
    <Section className="pt-28 pb-12">
      <Container className="max-w-xl text-center">
        <p className="text-8xl font-bold text-circuit mb-4 font-mono">404</p>
        <h1 className="text-2xl font-bold text-text mb-2">Page not found</h1>
        <p className="text-sm text-text-muted mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Try searching the Knowledge Index for what you need.
        </p>

        {/* Search bar */}
        <form action="/search" method="get" className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              name="q"
              placeholder="Search the Knowledge Index..."
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-circuit/50 focus:border-circuit"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-circuit text-base text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>
        </form>

        {/* Popular pages */}
        <div className="mb-8">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
            Popular pages
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {POPULAR_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-circuit hover:border-circuit/50 transition-colors"
              >
                {page.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="primary">Go home</Button>
          </Link>
          <Link href="/explore">
            <Button variant="secondary">Explore entities</Button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
