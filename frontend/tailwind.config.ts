import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          sunken: "var(--bg-sunken)",
          overlay: "var(--bg-overlay)",
        },
        border: {
          subtle: "var(--border-subtle)",
          default: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          inverse: "var(--text-inverse)",
        },
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
        },
        success: {
          bg: "var(--success-bg)",
          text: "var(--success-text)",
          border: "var(--success-border)",
        },
        warning: {
          bg: "var(--warning-bg)",
          text: "var(--warning-text)",
          border: "var(--warning-border)",
        },
        danger: {
          bg: "var(--danger-bg)",
          text: "var(--danger-text)",
          border: "var(--danger-border)",
        },
        info: {
          bg: "var(--info-bg)",
          text: "var(--info-text)",
          border: "var(--info-border)",
        },
        session: {
          deep: "var(--session-deep)",
          mechanical: "var(--session-mechanical)",
          buffer: "var(--session-buffer)",
          break: "var(--session-break)",
        },
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
}

export default config
