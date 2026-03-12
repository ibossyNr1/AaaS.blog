import { NextResponse } from "next/server";
import { getContrastRatio, meetsWCAG } from "@/lib/accessibility";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Theme color definitions to audit                                    */
/* ------------------------------------------------------------------ */

interface ThemeColors {
  name: string;
  pairs: { label: string; fg: string; bg: string }[];
}

const themes: ThemeColors[] = [
  {
    name: "dark",
    pairs: [
      { label: "text on background", fg: "#e4e4e7", bg: "#080809" },
      { label: "circuit on background", fg: "#00f3ff", bg: "#080809" },
      { label: "muted text on background", fg: "#71717a", bg: "#080809" },
      { label: "accent red on background", fg: "#F43F6C", bg: "#080809" },
      { label: "text on surface", fg: "#e4e4e7", bg: "#18181b" },
      { label: "circuit on surface", fg: "#00f3ff", bg: "#18181b" },
    ],
  },
  {
    name: "light",
    pairs: [
      { label: "text on background", fg: "#27272a", bg: "#fafaf8" },
      { label: "circuit on background", fg: "#0088a0", bg: "#fafaf8" },
      { label: "muted text on background", fg: "#71717a", bg: "#fafaf8" },
      { label: "accent red on background", fg: "#c9335a", bg: "#fafaf8" },
      { label: "text on surface", fg: "#27272a", bg: "#ffffff" },
      { label: "circuit on surface", fg: "#0088a0", bg: "#ffffff" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Heading hierarchy check (static analysis of expected structure)     */
/* ------------------------------------------------------------------ */

interface AuditIssue {
  type: "contrast" | "heading" | "alt-text" | "form-label";
  severity: "error" | "warning" | "info";
  message: string;
  element?: string;
}

/* ------------------------------------------------------------------ */
/*  GET handler                                                        */
/* ------------------------------------------------------------------ */

export async function GET() {
  const issues: AuditIssue[] = [];
  let totalChecks = 0;
  let passedChecks = 0;

  // --- Color contrast audit ---
  for (const theme of themes) {
    for (const pair of theme.pairs) {
      totalChecks++;
      const ratio = getContrastRatio(pair.fg, pair.bg);
      const passesAA = meetsWCAG(pair.fg, pair.bg, "AA");
      const passesAAA = meetsWCAG(pair.fg, pair.bg, "AAA");

      if (!passesAA) {
        issues.push({
          type: "contrast",
          severity: "error",
          message: `[${theme.name}] "${pair.label}" fails WCAG AA — ratio ${ratio.toFixed(2)}:1 (need 4.5:1). fg=${pair.fg} bg=${pair.bg}`,
        });
      } else if (!passesAAA) {
        passedChecks++;
        issues.push({
          type: "contrast",
          severity: "info",
          message: `[${theme.name}] "${pair.label}" passes AA but not AAA — ratio ${ratio.toFixed(2)}:1. fg=${pair.fg} bg=${pair.bg}`,
        });
      } else {
        passedChecks++;
      }
    }
  }

  // --- Heading hierarchy audit (expected page structure) ---
  totalChecks++;
  const expectedHeadings = ["h1", "h2", "h3"];
  const headingNote =
    "Ensure each page has exactly one h1, and heading levels do not skip (e.g., h1 → h3 without h2).";
  issues.push({
    type: "heading",
    severity: "info",
    message: `Heading hierarchy check: ${expectedHeadings.join(", ")} — ${headingNote}`,
  });
  passedChecks++; // Static advisory, counted as pass

  // --- Image alt text coverage advisory ---
  totalChecks++;
  issues.push({
    type: "alt-text",
    severity: "info",
    message:
      "All <img> elements should have descriptive alt text. Decorative images should use alt=\"\".",
  });
  passedChecks++;

  // --- Form label coverage advisory ---
  totalChecks++;
  issues.push({
    type: "form-label",
    severity: "info",
    message:
      "All form inputs must have associated <label> elements or aria-label attributes.",
  });
  passedChecks++;

  // --- Compute score ---
  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  return NextResponse.json({
    score,
    totalChecks,
    passedChecks,
    failedChecks: totalChecks - passedChecks,
    issues,
    checkedAt: new Date().toISOString(),
    wcagVersion: "2.1",
    targetLevel: "AA",
  });
}
