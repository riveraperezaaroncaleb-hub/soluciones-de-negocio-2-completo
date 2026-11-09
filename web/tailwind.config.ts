import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        azulejo: "var(--azulejo)",
        capa: "var(--capa)",
        tinta: "var(--tinta)",
        cromo: "var(--cromo)",
        poste: {
          rojo: "var(--poste-rojo)",
          azul: "var(--poste-azul)",
        },
        laton: "var(--laton)",
        ok: "var(--ok)",
        alerta: "var(--alerta)",
        peligro: "var(--peligro)",
        ink: "var(--tinta)",
        leaf: "var(--poste-azul)",
        lime: "var(--azulejo)",
        copper: "var(--laton)",
        canvas: "var(--capa)",
        muted: "var(--cromo)",
      },
      fontFamily: {
        sans: ["var(--font-texto)", "Segoe UI", "Arial", "sans-serif"],
        display: ["var(--font-rotulo)", "Arial Narrow", "sans-serif"],
      },
      boxShadow: {
        modal: "0 24px 80px rgba(8, 15, 26, 0.32)",
      },
      borderRadius: {
        control: "8px",
        card: "12px",
        sheet: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
