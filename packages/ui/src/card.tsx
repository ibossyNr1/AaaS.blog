import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./cn";

type AccentColor = "blue" | "purple" | "green" | "pink" | "gold" | "none";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: AccentColor;
  hover?: boolean;
}

const accentBorders: Record<AccentColor, string> = {
  blue: "border-t-2 border-t-blue",
  purple: "border-t-2 border-t-purple",
  green: "border-t-2 border-t-green",
  pink: "border-t-2 border-t-pink",
  gold: "border-t-2 border-t-gold",
  none: "",
};

const accentGlows: Record<AccentColor, string> = {
  blue: "hover:glow-blue",
  purple: "hover:glow-purple",
  green: "hover:glow-green",
  pink: "hover:glow-pink",
  gold: "hover:glow-gold",
  none: "",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, accent = "none", hover = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl bg-surface border border-border p-8 backdrop-blur-sm transition-all duration-300",
          hover && "hover:scale-[1.02] hover:border-surface-bright",
          hover && accentGlows[accent],
          accentBorders[accent],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
