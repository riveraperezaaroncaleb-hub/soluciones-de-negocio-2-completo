import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agendo Pro | Encuentra tu próxima barbería",
  description: "Reserva tu próximo corte, descubre ofertas y gana cortes gratis invitando amigos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
