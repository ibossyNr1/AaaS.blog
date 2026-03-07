import { type HTMLAttributes } from "react";
import { cn } from "./cn";

type BadgeColor = "blue" | "purple" | "green" | "pink" | "gold";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

const colors: Record<BadgeColor, string> = {
  blue: "bg-blue-subtle text-blue border-blue/20",
  purple: "bg-purple-subtle text-purple border-purple/20",
  green: "bg-green-subtle text-green border-green/20",
  pink: "bg-pink-subtle text-pink border-pink/20",
  gold: "bg-gold-subtle text-gold border-gold/20",
};

export function Badge({ className, color = "blue", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border",
        colors[color],
        className
      )}
      {...props}
    />
  );
}
