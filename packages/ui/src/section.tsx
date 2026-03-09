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
