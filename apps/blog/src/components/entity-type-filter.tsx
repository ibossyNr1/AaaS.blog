"use client";

import { cn } from "@aaas/ui";
import { ENTITY_TYPES, type EntityType } from "@/lib/types";

interface EntityTypeFilterProps {
  selected: EntityType | "all";
  onChange: (type: EntityType | "all") => void;
}

export function EntityTypeFilter({ selected, onChange }: EntityTypeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("all")}
        className={cn(
          "px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded transition-colors",
          selected === "all" ? "text-circuit border-circuit bg-circuit/10" : "text-text-muted border-border hover:border-circuit/30"
        )}
      >All</button>
      {(Object.entries(ENTITY_TYPES) as [EntityType, { label: string }][]).map(([type, info]) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={cn(
            "px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded transition-colors",
            selected === type ? "text-circuit border-circuit bg-circuit/10" : "text-text-muted border-border hover:border-circuit/30"
          )}
        >{info.label}</button>
      ))}
    </div>
  );
}
