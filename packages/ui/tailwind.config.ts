import type { Config } from "tailwindcss";

const sharedConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        base: "var(--basalt-deep)",
        surface: {
          DEFAULT: "var(--basalt-surface)",
          bright: "var(--basalt-bright)",
        },
        border: "var(--border)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        circuit: {
          DEFAULT: "var(--circuit-glow)",
          dim: "var(--circuit-dim)",
        },
        "accent-red": "var(--accent-red)",
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
        float: "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "circuit-flow": "circuitFlow 10s linear infinite",
        "orb-pulse": "orbPulse 4s ease-in-out infinite",
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
        circuitFlow: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        orbPulse: {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 30px var(--circuit-dim)",
          },
          "50%": {
            transform: "scale(1.1)",
            boxShadow: "0 0 60px var(--circuit-glow)",
          },
        },
      },
    },
  },
};

export default sharedConfig;
