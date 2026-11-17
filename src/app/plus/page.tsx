"use client";

import React from "react";
import Link from "next/link";
import { Users, Package, Settings, LogIn } from "lucide-react";

const LINKS = [
  {
    href: "/clients",
    title: "Clients & Fournisseurs",
    desc: "Acheteurs, fournisseurs et appel WhatsApp direct",
    Icon: Users,
  },
  {
    href: "/produits",
    title: "Produits & Catalogue",
    desc: "Prix FCFA, stocks, import et export Excel",
    Icon: Package,
  },
  {
    href: "/parametres",
    title: "Paramètres / Mon Entreprise",
    desc: "Logo de la ferme, adresse N'Djamena, téléphone",
    Icon: Settings,
  },
  {
    href: "/login",
    title: "Compte Administrateur",
    desc: "Connexion sécurisée Supabase Auth",
    Icon: LogIn,
  },
];

export default function PlusPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-green-950">Plus d&apos;options</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 hover:border-green-800"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-900">
              <item.Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900">{item.title}</h2>
              <p className="text-xs text-stone-600">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
