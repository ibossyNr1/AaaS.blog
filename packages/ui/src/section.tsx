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
