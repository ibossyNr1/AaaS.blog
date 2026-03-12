/* ------------------------------------------------------------------ */
/*  Accessibility utilities — WCAG 2.1 AA compliance helpers           */
/* ------------------------------------------------------------------ */

/**
 * Convert a hex color string to relative luminance per WCAG 2.1.
 * Accepts #RGB, #RRGGBB, or RRGGBB formats.
 */
export function hexToLuminance(hex: string): number {
  const clean = hex.replace(/^#/, "");
  let r: number, g: number, b: number;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255;
    g = parseInt(clean[1] + clean[1], 16) / 255;
    b = parseInt(clean[2] + clean[2], 16) / 255;
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16) / 255;
    g = parseInt(clean.slice(2, 4), 16) / 255;
    b = parseInt(clean.slice(4, 6), 16) / 255;
  } else {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  // sRGB to linear
  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Calculate the WCAG 2.1 contrast ratio between two hex colors.
 * Returns a value between 1 and 21.
 */
export function getContrastRatio(fg: string, bg: string): number {
  const l1 = hexToLuminance(fg);
  const l2 = hexToLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check whether two colors meet a WCAG contrast level.
 * - AA normal text: 4.5:1
 * - AA large text:  3:1
 * - AAA normal text: 7:1
 */
export function meetsWCAG(
  fg: string,
  bg: string,
  level: "AA" | "AAA" = "AA",
): boolean {
  const ratio = getContrastRatio(fg, bg);
  return level === "AAA" ? ratio >= 7 : ratio >= 4.5;
}

/**
 * Generate a descriptive aria-label for an entity element.
 */
export function generateAriaLabel(
  entityType: string,
  entityName: string,
  score?: number,
): string {
  const base = `${entityType}: ${entityName}`;
  if (score !== undefined) {
    return `${base}, composite score ${score} out of 100`;
  }
  return base;
}

/**
 * Format a keyboard shortcut for display (e.g. ["Cmd", "K"] → "Cmd + K").
 */
export function getKeyboardShortcutLabel(keys: string[]): string {
  return keys.join(" + ");
}

/**
 * All registered keyboard shortcuts in the application.
 */
export const KEYBOARD_SHORTCUTS: {
  key: string;
  description: string;
  action: string;
}[] = [
  { key: "/", description: "Open command palette", action: "openCommandPalette" },
  { key: "⌘+K", description: "Open command palette", action: "openCommandPalette" },
  { key: "?", description: "Show keyboard shortcuts", action: "toggleShortcuts" },
  { key: "Esc", description: "Close overlay", action: "closeOverlay" },
  { key: "g then e", description: "Go to Explore", action: "navigateExplore" },
  { key: "g then l", description: "Go to Leaderboard", action: "navigateLeaderboard" },
  { key: "g then d", description: "Go to Dashboard", action: "navigateDashboard" },
  { key: "g then s", description: "Go to Submit", action: "navigateSubmit" },
  { key: "g then a", description: "Go to Activity", action: "navigateActivity" },
  { key: "g then w", description: "Go to Watchlist", action: "navigateWatchlist" },
  { key: "g then h", description: "Go to Home", action: "navigateHome" },
  { key: "g then t", description: "Go to Stats", action: "navigateStats" },
  { key: "g then i", description: "Go to Listen", action: "navigateListen" },
  { key: "g then m", description: "Go to Embed", action: "navigateEmbed" },
  { key: "g then p", description: "Go to API Docs", action: "navigateApiDocs" },
];

/**
 * Announce a message to screen readers via a live region.
 * Creates or reuses a global aria-live region in the DOM.
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite",
): void {
  if (typeof document === "undefined") return;

  const id = `aaas-aria-live-${priority}`;
  let region = document.getElementById(id);

  if (!region) {
    region = document.createElement("div");
    region.id = id;
    region.setAttribute("aria-live", priority);
    region.setAttribute("aria-atomic", "true");
    region.setAttribute("role", priority === "assertive" ? "alert" : "status");
    region.className = "sr-only";
    document.body.appendChild(region);
  }

  // Clear then set to trigger announcement even if same message
  region.textContent = "";
  requestAnimationFrame(() => {
    region!.textContent = message;
  });
}
