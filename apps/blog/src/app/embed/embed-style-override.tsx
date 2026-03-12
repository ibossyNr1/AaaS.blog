"use client";

import { useEffect } from "react";

/**
 * Hides the site navbar and footer when rendering embed widget pages.
 * Uses DOM manipulation with static CSS — no user input involved.
 */
export function EmbedStyleOverride() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = [
      "body > header, body > footer,",
      "body > nav, body > div > nav,",
      ".index-navbar, .blog-footer {",
      "  display: none !important;",
      "}",
      "body > main {",
      "  min-height: auto !important;",
      "}",
    ].join("\n");
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
