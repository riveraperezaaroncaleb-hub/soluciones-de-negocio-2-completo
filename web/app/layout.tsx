import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agendo Pro | Reserva tu barbería",
  description: "Encuentra servicios de barbería, reserva tu cita y comparte beneficios con amigos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
