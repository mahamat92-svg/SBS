"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileSpreadsheet, Search, Eye } from "lucide-react";
import { loadAllData } from "@/lib/store";
import { exportAllFacturesExcel } from "@/lib/export-excel";
import { formatDateFR, formatFCFA } from "@/lib/format";
import type { Client, Facture, Profile, StatutFacture } from "@/types/database";

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<"Toutes" | StatutFacture>("Toutes");
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData().then((res) => {
      setFactures(res.data.factures);
      setClients(res.data.clients);
      setProfile(res.data.profile);
      setLoading(false);
    });
  }, []);

  const filtered = factures.filter((f) => {
    if (filtreStatut !== "Toutes" && f.statut !== filtreStatut) return false;
    if (recherche.trim()) {
      const cli = clients.find((c) => c.id === f.client_id);
      const q = recherche.toLowerCase();
      const matchNum = f.numero.toLowerCase().includes(q);
      const matchClient = (cli?.nom ?? "").toLowerCase().includes(q);
      if (!matchNum && !matchClient) return false;
    }
    return true;
  });

  async function handleExportAll() {
    if (!profile) return;
    await exportAllFacturesExcel(filtered, clients, profile);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-green-950 sm:text-3xl">
            Factures & Ventes
          </h1>
          <p className="text-sm text-stone-600">
            Créez, envoyez sur WhatsApp et exportez vos factures en Excel / PDF
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportAll}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-800 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>Exporter toutes en Excel</span>
          </button>
          <Link
            href="/factures/nouvelle"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-900"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Nouvelle facture</span>
          </Link>
        </div>
      </div>

      {/* Filtres et recherche */}
      <search className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(["Toutes", "Payee", "Impayee", "Envoyee", "Brouillon"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFiltreStatut(st)}
              className={`min-h-[40px] rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                filtreStatut === st
                  ? "bg-green-800 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {st === "Payee"
                ? "Payées"
                : st === "Impayee"
                  ? "Impayées"
                  : st === "Envoyee"
                    ? "Envoyées"
                    : st === "Brouillon"
                      ? "Brouillons"
                      : "Toutes"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 sm:w-72">
          <Search className="h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" />
          <label htmlFor="search-facture" className="sr-only">
            Rechercher par client ou numéro
          </label>
          <input
            id="search-facture"
            type="search"
            placeholder="Client ou N° facture..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </search>

      {/* Liste */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-stone-100" />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">
            Aucune facture trouvée pour ces critères.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                  <th className="py-3 pr-4">N° Facture</th>
                  <th className="py-3 pr-4">Client</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Paiement</th>
                  <th className="py-3 pr-4">Statut</th>
                  <th className="py-3 pr-4 text-right">Total</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((f) => {
                  const cli = clients.find((c) => c.id === f.client_id);
                  return (
                    <tr key={f.id} className="hover:bg-stone-50">
                      <td className="py-3.5 pr-4 font-bold text-green-900">
                        {f.numero}
                      </td>
                      <td className="py-3.5 pr-4">{cli?.nom ?? "Client comptoir"}</td>
                      <td className="py-3.5 pr-4 text-stone-600">{formatDateFR(f.date)}</td>
                      <td className="py-3.5 pr-4 text-stone-600">{f.mode_paiement}</td>
                      <td className="py-3.5 pr-4">
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
                      <td className="tabulaire py-3.5 pr-4 text-right font-extrabold text-stone-900">
                        {formatFCFA(f.total_fcfa)}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/factures/${f.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-100"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Ouvrir</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
