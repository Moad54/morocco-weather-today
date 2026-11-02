import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { navy: "#050b1f", volt: "#2f8bff", ice: "#8ec5ff" } } },
  plugins: [],
} satisfies Config;
