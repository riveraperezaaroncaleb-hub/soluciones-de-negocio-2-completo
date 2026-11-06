import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172019",
        leaf: "#33533b",
        lime: "#d8ee9b",
        copper: "#b96843",
        canvas: "#f6f7f4",
        muted: "#748078",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(21, 33, 24, 0.07)",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
