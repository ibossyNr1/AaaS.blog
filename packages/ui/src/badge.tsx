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
