/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "ui-serif", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        background: "oklch(0.985 0.002 260)",
        foreground: "oklch(0.18 0.04 265)",
        surface: "oklch(1 0 0)",
        border: "oklch(0.92 0.01 258)",
        muted: {
          DEFAULT: "oklch(0.97 0.005 260)",
          foreground: "oklch(0.55 0.03 258)",
        },
        primary: {
          DEFAULT: "oklch(0.22 0.04 265)",
          foreground: "oklch(0.99 0 0)",
        },
        accent: {
          DEFAULT: "oklch(0.58 0.19 262)",
          foreground: "oklch(0.99 0 0)",
          light: "oklch(0.965 0.02 258)",
        },
        destructive: {
          DEFAULT: "oklch(0.58 0.24 27)",
          foreground: "oklch(0.99 0 0)",
        },
      },
      borderRadius: {
        "3xl": "1.5rem",
        "2xl": "1.25rem",
        xl: "1rem",
        lg: "0.875rem",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, oklch(0.72 0.02 258 / 0.55) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.72 0.02 258 / 0.55) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-48": "48px 48px",
      },
    },
  },
  plugins: [],
};
