import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Zoho-like palette
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#eef6ff",
          100: "#d9ecff",
          200: "#bcdcff",
          300: "#8ec5ff",
          400: "#59a3ff",
          500: "#2f7ff6",
          600: "#1a63e6",
          700: "#154dbf",
          800: "#173f99",
          900: "#17397a",
          950: "#0f2347",
        },
        accent: {
          500: "#e8552b",
          600: "#d2451f",
        },
        ink: {
          900: "#1b1f23",
          800: "#2d343c",
          700: "#414b56",
          600: "#5a6675",
          500: "#7a8699",
          400: "#9aa6b8",
          300: "#c2cad6",
          200: "#e3e8ef",
          100: "#f0f3f7",
          50: "#f7f9fc",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16,24,40,0.05), 0 1px 3px 0 rgba(16,24,40,0.04)",
        cardhover: "0 4px 14px 0 rgba(16,24,40,0.08)",
        pop: "0 8px 28px rgba(16,24,40,0.16)",
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
export default config;
