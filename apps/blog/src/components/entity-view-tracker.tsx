"use client";

import { useEffect } from "react";
import type { EntityType } from "@/lib/types";
import { trackEntityView } from "@/lib/behavior";

interface EntityViewTrackerProps {
  type: EntityType;
  slug: string;
}

/** Invisible component that records an entity view on mount. */
export function EntityViewTracker({ type, slug }: EntityViewTrackerProps) {
  useEffect(() => {
    trackEntityView(type, slug);
  }, [type, slug]);

  return null;
}
