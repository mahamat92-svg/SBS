"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Landmark,
  FileText,
  Syringe,
  Package,
  ArrowRight,
  Plus,
} from "lucide-react";
import { loadAllData, updateItem } from "@/lib/store";
import type { CompteBancaire } from "@/types/database";
import type { DemoStoreState } from "@/lib/demo-data";
import { formatDateFR, formatDateTimeFR, formatFCFA, joursAvant } from "@/lib/format";

export default function DashboardPage() {
  const [state, setState] = useState<DemoStoreState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshData() {
    const res = await loadAllData();
    setState(res.data);
  }

  useEffect(() => {
    let active = true;
    loadAllData().then((res) => {
      if (active) setState(res.data);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleRefreshBalances() {
    if (!state) return;
    setRefreshing(true);
    const now = new Date().toISOString();
    for (const cpt of state.comptes_bancaires) {
      await updateItem<CompteBancaire>("comptes_bancaires", cpt.id, { derniere_synchro: now });
    }
    await refreshData();
    setRefreshing(false);
  }

  if (!state) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-stone-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-200" />
          ))}
        </div>
      </div>
    );
  }

  const nowMonth = new Date().toISOString().slice(0, 7);
  const ventesMois = state.transactions
    .filter((t) => t.type === "Entree" && t.date.startsWith(nowMonth))
    .reduce((acc, t) => acc + Number(t.montant_fcfa), 0);

  const depensesMois = state.transactions
    .filter((t) => t.type === "Sortie" && t.date.startsWith(nowMonth))
    .reduce((acc, t) => acc + Number(t.montant_fcfa), 0);

  const totalEntrees = state.transactions
    .filter((t) => t.type === "Entree")
    .reduce((acc, t) => acc + Number(t.montant_fcfa), 0);
  const totalSorties = state.transactions
    .filter((t) => t.type === "Sortie")
    .reduce((acc, t) => acc + Number(t.montant_fcfa), 0);

  const benefice = ventesMois - depensesMois;
  const facturesImpayees = state.factures.filter((f) => f.statut === "Impayee");
  const totalImpayees = facturesImpayees.reduce((acc, f) => acc + Number(f.total_fcfa), 0);

  const soldeTotalBanque = state.comptes_bancaires.reduce(
    (acc, c) => acc + Number(c.solde_fcfa),
    0
  );

  // Alertes
  const vaccinsProches = state.vaccins.filter((v) => {
    if (v.statut === "Fait") return false;
    const j = joursAvant(v.date_rappel);
    return j <= 3;
  });

  const produitsBas = state.produits.filter((p) => Number(p.stock) <= Number(p.seuil_alerte));
  const intrantsBas = state.intrants.filter((i) => Number(i.quantite) <= Number(i.seuil_alerte));

  const maxChart = Math.max(totalEntrees, totalSorties, 1);
  const pctEntrees = Math.round((totalEntrees / maxChart) * 100);
  const pctSorties = Math.round((totalSorties / maxChart) * 100);

  const last5Factures = state.factures.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* En-tête rapide */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-green-950 sm:text-3xl">
            Tableau de bord
          </h1>
          <p className="text-sm text-stone-600">
            Vue financière et opérationnelle — {state.profile.nom_ferme}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/factures/nouvelle"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-900"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Nouvelle facture</span>
          </Link>
        </div>
      </div>

      {/* 4 cartes KPI en haut */}
      <section aria-label="Indicateurs financiers" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Ventes du mois
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-800">
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <p className="tabulaire mt-3 text-2xl font-extrabold text-green-800">
            {formatFCFA(ventesMois)}
          </p>
          <p className="mt-1 text-xs text-stone-500">Entrées encaissées ce mois</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Dépenses du mois
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <TrendingDown className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <p className="tabulaire mt-3 text-2xl font-extrabold text-red-700">
            {formatFCFA(depensesMois)}
          </p>
          <p className="mt-1 text-xs text-stone-500">Intrants, aliments, frais</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Bénéfice net
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <p
            className={`tabulaire mt-3 text-2xl font-extrabold ${
              benefice >= 0 ? "text-green-900" : "text-red-700"
            }`}
          >
            {formatFCFA(benefice)}
          </p>
          <p className="mt-1 text-xs text-stone-500">Ventes − Dépenses</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Factures impayées
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200 text-amber-950">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <p className="tabulaire mt-3 text-2xl font-extrabold text-amber-950">
            {formatFCFA(totalImpayees)}
          </p>
          <p className="mt-1 text-xs font-medium text-amber-900">
            {facturesImpayees.length} facture(s) en attente
          </p>
        </div>
      </section>

      {/* Carte SOLDE BANCAIRE en gros */}
      <section className="rounded-2xl border border-green-900/20 bg-gradient-to-br from-green-900 to-green-800 p-5 text-white sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-green-200">
              <Landmark className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider">
                SOLDE BANCAIRE TOTAL (TOUS MES COMPTES)
              </span>
            </div>
            <p className="tabulaire mt-2 text-3xl font-black tracking-tight sm:text-5xl">
              {formatFCFA(soldeTotalBanque)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefreshBalances}
              disabled={refreshing}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              <span>Actualiser le solde</span>
            </button>
            <Link
              href="/comptes"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400"
            >
              <span>Gérer mes comptes</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {state.comptes_bancaires.map((cpt) => (
            <div
              key={cpt.id}
              className="rounded-xl border border-white/15 bg-white/10 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold text-white">
                  {cpt.nom_banque}
                </span>
                <span className="shrink-0 rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-medium text-green-100">
                  •••• {cpt.numero_masque}
                </span>
              </div>
              <p className="tabulaire mt-2 text-xl font-extrabold text-amber-300">
                {formatFCFA(cpt.solde_fcfa)}
              </p>
              <p className="mt-1 truncate text-[11px] text-green-100/80">
                Synchro : {formatDateTimeFR(cpt.derniere_synchro)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Graphique Entrées vs Sorties + Alertes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Graphique simple Entrées (Vert) vs Sorties (Rouge) */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-stone-900">
            Entrées vs Sorties (FCFA)
          </h2>
          <p className="text-sm text-stone-500">
            Comparatif global de votre trésorerie
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                <span className="text-green-800">Entrées (Ventes & apports)</span>
                <span className="tabulaire text-green-900">{formatFCFA(totalEntrees)}</span>
              </div>
              <div className="h-8 w-full overflow-hidden rounded-xl bg-stone-100">
                <div
                  className="h-full rounded-xl bg-green-700 transition-all duration-500"
                  style={{ width: `${Math.max(pctEntrees, 4)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                <span className="text-red-700">Sorties (Dépenses & achats)</span>
                <span className="tabulaire text-red-800">{formatFCFA(totalSorties)}</span>
              </div>
              <div className="h-8 w-full overflow-hidden rounded-xl bg-stone-100">
                <div
                  className="h-full rounded-xl bg-red-600 transition-all duration-500"
                  style={{ width: `${Math.max(pctSorties, 4)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Alertes */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-stone-900">Alertes prioritaires</h2>
          <p className="text-sm text-stone-500">
            Vaccins dans 3 jours, stocks bas et factures impayées
          </p>

          <div className="mt-4 space-y-3">
            {vaccinsProches.length === 0 &&
              produitsBas.length === 0 &&
              intrantsBas.length === 0 &&
              facturesImpayees.length === 0 && (
                <p className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-900">
                  Aucune alerte urgente aujourd&apos;hui. Tout est à jour !
                </p>
              )}

            {vaccinsProches.map((v) => {
              const animal = state.animaux.find((a) => a.id === v.animal_id);
              return (
                <div
                  key={v.id}
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5"
                >
                  <Syringe className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-red-900">
                      Vaccin à faire : {v.nom_vaccin}
                    </p>
                    <p className="text-xs text-red-800">
                      Animal {animal?.numero_boucle ?? "—"} • Rappel prévu le{" "}
                      {formatDateFR(v.date_rappel)}
                    </p>
                  </div>
                  <Link
                    href="/elevage"
                    className="shrink-0 text-xs font-bold text-red-900 underline"
                  >
                    Voir
                  </Link>
                </div>
              );
            })}

            {produitsBas.map((p) => (
              <div
                key={p.id}
                className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5"
              >
                <Package className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-amber-950">
                    Stock bas produit : {p.nom}
                  </p>
                  <p className="text-xs text-amber-900">
                    Reste {p.stock} {p.unite} (seuil : {p.seuil_alerte})
                  </p>
                </div>
                <Link
                  href="/produits"
                  className="shrink-0 text-xs font-bold text-amber-950 underline"
                >
                  Gérer
                </Link>
              </div>
            ))}

            {intrantsBas.map((i) => (
              <div
                key={i.id}
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5"
              >
                <Package className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-red-900">
                    Intrant bas : {i.nom}
                  </p>
                  <p className="text-xs text-red-800">
                    Reste {i.quantite} {i.unite}
                  </p>
                </div>
                <Link
                  href="/agriculture"
                  className="shrink-0 text-xs font-bold text-red-900 underline"
                >
                  Voir
                </Link>
              </div>
            ))}

            {facturesImpayees.map((f) => {
              const cli = state.clients.find((c) => c.id === f.client_id);
              return (
                <div
                  key={f.id}
                  className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5"
                >
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-amber-950">
                      Facture impayée {f.numero} — {formatFCFA(f.total_fcfa)}
                    </p>
                    <p className="text-xs text-amber-900">
                      Client : {cli?.nom ?? "Comptoir"} • {formatDateFR(f.date)}
                    </p>
                  </div>
                  <Link
                    href={`/factures/${f.id}`}
                    className="shrink-0 text-xs font-bold text-amber-950 underline"
                  >
                    Ouvrir
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 5 dernières factures */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-stone-900">5 dernières factures</h2>
          <Link
            href="/factures"
            className="text-sm font-bold text-green-800 hover:underline"
          >
            Toutes les factures →
          </Link>
        </div>

        <div className="table-wrapper mt-4">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <th className="py-3 pr-4">N° Facture</th>
                <th className="py-3 pr-4">Client</th>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Statut</th>
                <th className="py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {last5Factures.map((f) => {
                const cli = state.clients.find((c) => c.id === f.client_id);
                return (
                  <tr key={f.id} className="hover:bg-stone-50">
                    <td className="py-3 pr-4 font-bold text-green-900">
                      <Link href={`/factures/${f.id}`} className="hover:underline">
                        {f.numero}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{cli?.nom ?? "Client comptoir"}</td>
                    <td className="py-3 pr-4 text-stone-600">{formatDateFR(f.date)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          f.statut === "Payee"
                            ? "bg-green-100 text-green-800"
                            : f.statut === "Impayee"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {f.statut === "Payee"
                          ? "Payée"
                          : f.statut === "Impayee"
                            ? "Impayée"
                            : f.statut === "Envoyee"
                              ? "Envoyée"
                              : "Brouillon"}
                      </span>
                    </td>
                    <td className="tabulaire py-3 text-right font-bold text-stone-900">
                      {formatFCFA(f.total_fcfa)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
