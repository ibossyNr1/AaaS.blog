import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  carved?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, carved = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] p-8 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "hover:-translate-y-2.5 hover:bg-[rgba(255,255,255,0.04)] hover:border-circuit",
          carved && "card-carved",
          className
        )}
        {...props}
      >
        {/* Circuit accent bar */}
        <div className="absolute top-0 left-0 w-10 h-0.5 bg-circuit shadow-[0_0_15px_var(--circuit-glow)]" />
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
