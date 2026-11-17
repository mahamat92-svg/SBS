import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgriElevage Tchad Pro — Gestion Ferme, Élevage, Factures & Banque",
  description:
    "SaaS PRO Mono-Client Agriculture et Élevage au Tchad (N'Djamena). Facturation FCFA, Excel, PDF, WhatsApp, Airtel Money, Moov Money et comptes bancaires.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={outfit.className}>
      <body className="min-h-dvh bg-[#f7f6f2] text-stone-900 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
