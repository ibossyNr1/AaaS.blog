import { type HTMLAttributes } from "react";
import { cn } from "./cn";

export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("max-w-7xl mx-auto", className)} {...props} />
  );
}
