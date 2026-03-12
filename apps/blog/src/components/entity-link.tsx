"use client";

import Link from "next/link";
import { cn } from "@aaas/ui";
import { EntityHoverCard } from "./entity-hover-card";

interface EntityLinkProps {
  type: string;
  slug: string;
  children: React.ReactNode;
  className?: string;
}

export function EntityLink({ type, slug, children, className }: EntityLinkProps) {
  return (
    <EntityHoverCard type={type} slug={slug}>
      <Link
        href={`/${type}/${slug}`}
        className={cn(
          "text-text hover:text-circuit transition-colors",
          className
        )}
      >
        {children}
      </Link>
    </EntityHoverCard>
  );
}
