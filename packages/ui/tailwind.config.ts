import type { Config } from "tailwindcss";

const sharedConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        base: "hsl(var(--base))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          bright: "hsl(var(--surface-bright))",
        },
        border: "hsl(var(--border))",
        text: {
          DEFAULT: "hsl(var(--text))",
          muted: "hsl(var(--text-muted))",
        },
        blue: {
          DEFAULT: "hsl(var(--blue))",
          glow: "hsl(var(--blue) / 0.15)",
          subtle: "hsl(var(--blue) / 0.08)",
        },
        purple: {
          DEFAULT: "hsl(var(--purple))",
          glow: "hsl(var(--purple) / 0.15)",
          subtle: "hsl(var(--purple) / 0.08)",
        },
        green: {
          DEFAULT: "hsl(var(--green))",
          glow: "hsl(var(--green) / 0.15)",
          subtle: "hsl(var(--green) / 0.08)",
        },
        pink: {
          DEFAULT: "hsl(var(--pink))",
          glow: "hsl(var(--pink) / 0.15)",
          subtle: "hsl(var(--pink) / 0.08)",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          glow: "hsl(var(--gold) / 0.15)",
          subtle: "hsl(var(--gold) / 0.08)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
};

export default sharedConfig;
