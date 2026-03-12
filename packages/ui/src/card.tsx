"use client";

import { forwardRef, useRef, type HTMLAttributes, type MouseEvent } from "react";
import { cn } from "./cn";

type CardVariant = "default" | "glass" | "bedrock";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  carved?: boolean;
  variant?: CardVariant;
  spotlight?: boolean;
  accentColor?: "circuit" | "red";
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "card-default rounded-lg",
  glass:
    "glass rounded-lg",
  bedrock:
    "bedrock rounded-lg",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      carved = false,
      variant = "default",
      spotlight = false,
      accentColor = "circuit",
      children,
      onMouseMove,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLDivElement>(null);

    function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
      if (spotlight && innerRef.current) {
        const rect = innerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        innerRef.current.style.setProperty("--spotlight-x", `${x}px`);
        innerRef.current.style.setProperty("--spotlight-y", `${y}px`);
      }
      onMouseMove?.(e);
    }

    const accentBar =
      accentColor === "red"
        ? "bg-accent-red shadow-[0_0_15px_rgb(var(--accent-red))]"
        : "bg-circuit shadow-[0_0_15px_rgb(var(--circuit-glow))]";

    return (
      <div
        ref={(node) => {
          (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          "group relative p-8 transition-all duration-500 ease-liquid overflow-hidden",
          "hover:-translate-y-2 hover:border-circuit/25 hover:shadow-[0_0_20px_var(--circuit-dim),0_8px_32px_rgba(0,0,0,0.3)]",
          variantStyles[variant],
          spotlight &&
            "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 before:bg-[radial-gradient(600px_circle_at_var(--spotlight-x)_var(--spotlight-y),rgba(0,243,255,0.06),transparent_40%)]",
          carved && "card-carved",
          className
        )}
        onMouseMove={handleMouseMove}
        {...props}
      >
        {/* Full-width hover shine line at top */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-0.5 opacity-0 transition-opacity duration-400",
            "group-hover:opacity-100",
            accentBar
          )}
        />
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
