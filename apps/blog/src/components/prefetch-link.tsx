"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

interface PrefetchLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  priority?: boolean;
}

/**
 * Smart prefetching link that extends Next.js Link with:
 * - IntersectionObserver-based prefetching (prefetch when visible)
 * - Priority prefetching for above-the-fold links
 * - Debounced hover prefetching
 */
export function PrefetchLink({
  children,
  className,
  priority = false,
  href,
  ...props
}: PrefetchLinkProps) {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefetchedRef = useRef(false);

  const doPrefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;

    const url = typeof href === "string" ? href : href.pathname ?? "";
    if (url) router.prefetch(url);
  }, [href, router]);

  // IntersectionObserver — prefetch when visible
  useEffect(() => {
    if (priority) {
      doPrefetch();
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          doPrefetch();
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, doPrefetch]);

  // Debounced hover prefetch (150ms)
  const handleMouseEnter = useCallback(() => {
    if (prefetchedRef.current) return;
    hoverTimerRef.current = setTimeout(doPrefetch, 150);
  }, [doPrefetch]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <Link
      ref={ref}
      href={href}
      className={className}
      prefetch={false}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Link>
  );
}
