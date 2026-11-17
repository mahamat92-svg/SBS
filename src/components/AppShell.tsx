"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  FileText,
  Sprout,
  Beef,
  Landmark,
  Menu,
  LogOut,
  Users,
  Package,
  Settings,
} from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadAllData } from "@/lib/store";
import type { Profile } from "@/types/database";

const MOBILE_NAV = [
  { href: "/", label: "Accueil", Icon: Home },
  { href: "/factures", label: "Factures", Icon: FileText },
  { href: "/agriculture", label: "Agriculture", Icon: Sprout },
  { href: "/elevage", label: "Élevage", Icon: Beef },
  { href: "/comptes", label: "Comptes", Icon: Landmark },
  { href: "/plus", label: "Plus", Icon: Menu },
];

const DESKTOP_EXTRA = [
  { href: "/clients", label: "Clients", Icon: Users },
  { href: "/produits", label: "Produits", Icon: Package },
  { href: "/parametres", label: "Paramètres", Icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<"supabase" | "demo">("demo");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadAllData().then((res) => {
      if (!active) return;
      setProfile(res.data.profile);
      setMode(res.mode);
      setUserEmail(res.userEmail);
      if (res.mode === "supabase" && !res.userEmail && pathname !== "/login") {
        router.replace("/login");
      }
    });
    return () => {
      active = false;
    };
  }, [pathname, router]);

  async function handleLogout() {
    const supabase = createClient();
    if (supabase && isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  }

  if (pathname === "/login") {
    return <div className="min-h-dvh bg-[#f7f6f2]">{children}</div>;
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f6f2] text-stone-900">
      {/* Header sticky sans position: absolute */}
      <header className="no-print sticky top-0 z-20 border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {profile?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logo_url}
                alt={profile.nom_ferme}
                className="h-10 w-10 shrink-0 rounded-xl border border-stone-200 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-800 font-bold text-white">
                AE
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-green-900 sm:text-base">
                {profile?.nom_ferme || "AgriElevage Tchad Pro"}
              </p>
              <p className="truncate text-xs text-amber-800">
                {profile?.ville || "N'Djamena"}, {profile?.pays || "Tchad"} • FCFA
              </p>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
            {[...MOBILE_NAV.slice(0, 5), ...DESKTOP_EXTRA].map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-green-800 text-white"
                      : "text-stone-700 hover:bg-green-50 hover:text-green-900"
                  }`}
                >
                  <item.Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {mode === "demo" ? (
              <span className="hidden rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 sm:inline-flex">
                Aperçu local
              </span>
            ) : (
              userEmail && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 lg:py-7">
        {children}
      </main>

      {/* Menu bas mobile sticky (zéro position: absolute, zéro chevauchement) */}
      <nav
        aria-label="Menu mobile"
        className="no-print sticky bottom-0 z-20 border-t border-stone-200 bg-white lg:hidden"
      >
        <ul className="grid grid-cols-6 gap-0.5 px-1 py-1.5">
          {MOBILE_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-[11px] font-semibold transition-colors ${
                    active
                      ? "bg-green-800 text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-green-900"
                  }`}
                >
                  <item.Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
