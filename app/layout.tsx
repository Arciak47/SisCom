import type { Metadata } from "next";
import "./globals.css";
import ClientInitializer from "@/components/ClientInitializer";

export const metadata: Metadata = {
  title: "SisCOM – Sistema de Control del Comedor | INVECEM",
  description: "Sistema de Control de Asistencia del Comedor – Planta INVECEM",
  manifest: "/manifest.json"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      style={{ height: "100%" }}
    >
      <body style={{ height: "100%", margin: 0, padding: 0 }}>
        <ClientInitializer />
        {children}
      </body>
    </html>
  );
}
