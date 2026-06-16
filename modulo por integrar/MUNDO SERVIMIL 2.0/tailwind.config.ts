import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1F4E78",
          light: "#2E75B6",
          dark: "#163A5A",
        },
        ok: "#16A34A",
        warn: "#CA8A04",
        bad: "#DC2626",
        canvas: "#F8FAFC",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
