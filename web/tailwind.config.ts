import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--tinta)",
        leaf: "var(--poste-azul)",
        lime: "var(--azulejo)",
        copper: "var(--laton)",
        canvas: "var(--capa)",
        muted: "var(--cromo)",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(21, 33, 24, 0.07)",
      },
      fontFamily: { sans: ["Arial", "Helvetica", "sans-serif"] },
    },
  },
  plugins: [],
};

export default config;
