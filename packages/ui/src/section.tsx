import { type HTMLAttributes } from "react";
import { cn } from "./cn";

type SectionVariant = "default" | "surface" | "bedrock";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: SectionVariant;
  divider?: boolean | "red";
  /** Make section semi-transparent for parallax background visibility */
  parallax?: boolean;
}

export function Section({
  className,
  variant = "default",
  divider = false,
  parallax = false,
  ...props
}: SectionProps) {
  return (
    <>
      {divider && (
        <div className={cn("kinetic-bar", divider === "red" && "red")} />
      )}
      <section
        className={cn(
          "py-12 md:py-24 px-4 md:px-6",
          variant === "surface" && !parallax && "bg-surface/70 backdrop-blur-xl",
          variant === "bedrock" && !parallax && "bedrock",
          parallax && "parallax-overlay",
          className
        )}
        {...props}
      />
    </>
  );
}
