import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        veda: {
          orange: "#FF6B00",
          "orange-light": "#FF8A3D",
          dark: "#1A1A1A",
          gray: "#F3F4F6",
          "gray-dark": "#6B7280",
          sidebar: "#FFFFFF",
          card: "#FFFFFF",
          accent: "#10B981",
        },
      },
      fontFamily: {
        sans: ["var(--font-bricolage)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
        glow: "0 0 0 2px rgba(255, 107, 0, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
