import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NISE - Núcleo de Inteligência Segurança Escolar",
  description:
    "Sistema de gerenciamento de patrulhamento tático nas unidades escolares da rede municipal.",
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/images/favicon.png" type="image/png" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
