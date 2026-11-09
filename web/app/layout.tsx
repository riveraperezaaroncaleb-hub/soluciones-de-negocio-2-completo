import type { Metadata } from "next";
import { Big_Shoulders_Display, Hanken_Grotesk } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const rotulo = Big_Shoulders_Display({
  subsets: ["latin"],
  variable: "--font-rotulo",
  weight: ["600", "700", "800"],
  display: "swap",
});

const texto = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-texto",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agendo Pro | Reserva tu barbería",
  description: "Encuentra servicios de barbería, reserva tu cita y comparte beneficios con amigos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body className={`${rotulo.variable} ${texto.variable}`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
