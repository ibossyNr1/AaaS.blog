"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface FocusTrapProps {
  active: boolean;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

/**
 * Traps keyboard focus within its children when `active` is true.
 * Returns focus to the previously focused element on deactivation.
 */
export function FocusTrap({ active, children }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Capture the trigger element when trap activates
  useEffect(() => {
    if (active) {
      triggerRef.current = document.activeElement;

      // Focus the first focusable element inside the trap
      requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;
        const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        first?.focus();
      });
    } else if (triggerRef.current) {
      // Return focus to trigger element on deactivation
      (triggerRef.current as HTMLElement).focus?.();
      triggerRef.current = null;
    }
  }, [active]);

  // Handle Tab key to cycle focus within the trap
  useEffect(() => {
    if (!active) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: wrap from first to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: wrap from last to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  return (
    <div ref={containerRef} data-focus-trap={active ? "active" : "inactive"}>
      {children}
    </div>
  );
}
