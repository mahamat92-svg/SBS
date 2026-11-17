"use client";

import React, { useEffect, useState } from "react";
import {
  Landmark,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  KeyRound,
  Wallet,
  Unplug,
  ReceiptText,
} from "lucide-react";
import ModalDialog from "@/components/ModalDialog";
import {
  addManualTransaction,
  deleteItem,
  importReleveRows,
  insertItem,
  loadAllData,
  updateItem,
} from "@/lib/store";
import { parseReleveFile } from "@/lib/export-excel";
import { formatDateFR, formatDateTimeFR, formatFCFA, todayISO } from "@/lib/format";
import {
  BANQUES_TCHAD,
  type CompteBancaire,
  type ReleveBancaire,
  type Transaction,
  type TypeCompte,
  type TypeTransaction,
} from "@/types/database";

const TOUTES_BANQUES = [
  ...BANQUES_TCHAD,
  "Airtel Money Tchad",
  "Moov Money Tchad",
  "Caisse Ferme",
];

function BankBadge({ nom }: { nom: string }) {
  const initials = nom
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const isMobile = nom.toLowerCase().includes("airtel") || nom.toLowerCase().includes("moov");
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white ${
        isMobile ? "bg-amber-700" : "bg-green-800"
      }`}
      aria-hidden="true"
    >
      {initials || "BQ"}
    </div>
  );
}

export default function ComptesPage() {
  const [comptes, setComptes] = useState<CompteBancaire[]>([]);
  const [releves, setReleves] = useState<ReleveBancaire[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Modales
  const [openConnect, setOpenConnect] = useState(false);
  const [connectTab, setConnectTab] = useState<"A" | "B" | "C">("A");

  // Option A : Agrégateur
  const [aggProvider, setAggProvider] = useState<"Mono" | "Okra" | "Plaid" | "Bridge">("Mono");
  const [aggBank, setAggBank] = useState<string>("Ecobank Tchad");
  const [aggLoading, setAggLoading] = useState(false);

  // Option B : Clé API banque
  const [apiBank, setApiBank] = useState<string>("Ecobank Tchad");
  const [apiUrl, setApiUrl] = useState("https://api.ecobank.com/v1/accounts/balance");
  const [apiToken, setApiToken] = useState("");
  const [apiMask, setApiMask] = useState("4821");
  const [apiTesting, setApiTesting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Option C : Connexion manuelle
  const [manType, setManType] = useState<TypeCompte>("Banque");
  const [manBank, setManBank] = useState<string>("Ecobank Tchad");
  const [manNomCompte, setManNomCompte] = useState("");
  const [manMask, setManMask] = useState("0000");
  const [manSolde, setManSolde] = useState("0");

  // Modale Relevé
  const [releveCompte, setReleveCompte] = useState<CompteBancaire | null>(null);

  // Modale Import Relevé Excel / CSV
  const [openImport, setOpenImport] = useState(false);
  const [importCompteId, setImportCompteId] = useState("");
  const [importBusy, setImportBusy] = useState(false);

  // Modale Transaction manuelle
  const [openTx, setOpenTx] = useState(false);
  const [txType, setTxType] = useState<TypeTransaction>("Entree");
  const [txMontant, setTxMontant] = useState("");
  const [txCompteId, setTxCompteId] = useState("");
  const [txMotif, setTxMotif] = useState("");
  const [txDate, setTxDate] = useState(todayISO());

  async function refresh() {
    setLoading(true);
    const res = await loadAllData();
    setComptes(res.data.comptes_bancaires);
    setReleves(res.data.releves_bancaires);
    setTransactions(res.data.transactions);
    if (res.data.comptes_bancaires.length > 0) {
      setImportCompteId((prev) => prev || res.data.comptes_bancaires[0].id);
      setTxCompteId((prev) => prev || res.data.comptes_bancaires[0].id);
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    loadAllData().then((res) => {
      if (!active) return;
      setComptes(res.data.comptes_bancaires);
      setReleves(res.data.releves_bancaires);
      setTransactions(res.data.transactions);
      if (res.data.comptes_bancaires.length > 0) {
        setImportCompteId((prev) => prev || res.data.comptes_bancaires[0].id);
        setTxCompteId((prev) => prev || res.data.comptes_bancaires[0].id);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const soldeTotal = comptes.reduce((acc, c) => acc + Number(c.solde_fcfa), 0);

  async function handleOptionA() {
    setAggLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/banque/aggregateur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: aggProvider, nom_banque: aggBank }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        provider: string;
        nom_banque: string;
        numero_masque: string;
        solde_fcfa: number;
        vault_secret_id: string;
      };
      if (json.ok) {
        await insertItem<CompteBancaire>("comptes_bancaires", {
          type: "Banque",
          nom_banque: json.nom_banque,
          nom_compte: `Compte ${json.nom_banque} (${json.provider})`,
          numero_masque: json.numero_masque,
          solde_fcfa: json.solde_fcfa,
          derniere_synchro: new Date().toISOString(),
          statut_connexion: "Connecte",
          provider: json.provider,
          vault_secret_id: json.vault_secret_id,
        });
        setOpenConnect(false);
        setStatusMsg(`Compte ${json.nom_banque} connecté via ${json.provider} sans mot de passe stocké.`);
        await refresh();
      }
    } finally {
      setAggLoading(false);
    }
  }

  async function handleOptionB(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    setApiTesting(true);
    try {
      const res = await fetch("/api/banque/tester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom_banque: apiBank,
          api_url: apiUrl,
          api_token: apiToken,
          numero_masque: apiMask,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
        solde_fcfa?: number;
        vault_secret_id?: string;
      };
      if (!json.ok) {
        setApiError(json.error || "Échec du test API.");
        return;
      }
      await insertItem<CompteBancaire>("comptes_bancaires", {
        type: "Banque",
        nom_banque: apiBank,
        nom_compte: `${apiBank} (API)`,
        numero_masque: apiMask.slice(-4) || "0000",
        solde_fcfa: json.solde_fcfa ?? 0,
        derniere_synchro: new Date().toISOString(),
        statut_connexion: "Connecte",
        provider: "API Banque",
        api_url: apiUrl,
        vault_secret_id: json.vault_secret_id ?? null,
      });
      setApiToken("");
      setOpenConnect(false);
      setStatusMsg(json.message || "Compte connecté par clé API.");
      await refresh();
    } finally {
      setApiTesting(false);
    }
  }

  async function handleOptionC(e: React.FormEvent) {
    e.preventDefault();
    await insertItem<CompteBancaire>("comptes_bancaires", {
      type: manType,
      nom_banque: manBank,
      nom_compte: manNomCompte.trim() || `${manBank} Principal`,
      numero_masque: manMask.slice(-4) || "0000",
      solde_fcfa: Number(manSolde) || 0,
      derniere_synchro: new Date().toISOString(),
      statut_connexion: "Manuel",
      provider: "Manuel",
    });
    setManNomCompte("");
    setManSolde("0");
    setOpenConnect(false);
    setStatusMsg(`Compte ${manBank} ajouté en mode manuel.`);
    await refresh();
  }

  async function handleRefreshCompte(cpt: CompteBancaire) {
    await updateItem<CompteBancaire>("comptes_bancaires", cpt.id, {
      derniere_synchro: new Date().toISOString(),
    });
    setStatusMsg(`Solde de ${cpt.nom_banque} actualisé.`);
    await refresh();
  }

  async function handleDisconnectCompte(cpt: CompteBancaire) {
    await deleteItem("comptes_bancaires", cpt.id);
    setStatusMsg(`Compte ${cpt.nom_banque} déconnecté.`);
    await refresh();
  }

  async function handleImportReleve(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !importCompteId) return;
    setImportBusy(true);
    try {
      const rows = await parseReleveFile(file);
      const count = await importReleveRows(importCompteId, rows);
      setOpenImport(false);
      setStatusMsg(`${count} ligne(s) importée(s) dans le relevé bancaire et solde mis à jour.`);
      await refresh();
    } finally {
      setImportBusy(false);
      e.target.value = "";
    }
  }

  async function handleAddTx(e: React.FormEvent) {
    e.preventDefault();
    const montant = Number(txMontant);
    if (!montant || montant <= 0 || !txMotif.trim()) return;
    await addManualTransaction({
      compte_id: txCompteId || null,
      type: txType,
      montant_fcfa: montant,
      motif: txMotif.trim(),
      date: txDate,
      facture_id: null,
    });
    setTxMontant("");
    setTxMotif("");
    setOpenTx(false);
    setStatusMsg("Transaction ajoutée et solde mis à jour.");
    await refresh();
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-green-950 sm:text-3xl">
            Mes Comptes Bancaires & Mobile Money
          </h1>
          <p className="text-sm text-stone-600">
            Tchad — Ecobank, UBA, BCC, BSIC, Orabank, Airtel Money, Moov Money & Caisse
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpenConnect(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-900"
          >
            <Landmark className="h-4 w-4" aria-hidden="true" />
            <span>Connecter mon compte bancaire</span>
          </button>
          <button
            type="button"
            onClick={() => setOpenImport(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-800 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>Importer relevé Excel / CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setOpenTx(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 hover:bg-stone-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Ajouter une transaction manuelle</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          role="status"
          className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm font-semibold text-green-900"
        >
          {statusMsg}
        </div>
      )}

      {/* Solde total */}
      <div className="rounded-2xl bg-green-900 p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-green-200">
          Trésorerie consolidée (Tchad)
        </p>
        <p className="tabulaire mt-1 text-3xl font-black sm:text-4xl">
          {formatFCFA(soldeTotal)}
        </p>
        <p className="mt-1 text-xs text-green-100">
          Aucun mot de passe bancaire n&apos;est jamais stocké dans l&apos;application.
        </p>
      </div>

      {/* Grille des comptes */}
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-stone-200" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {comptes.map((cpt) => (
            <article
              key={cpt.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BankBadge nom={cpt.nom_banque} />
                    <div>
                      <h2 className="text-base font-bold text-stone-900">
                        {cpt.nom_banque}
                      </h2>
                      <p className="text-xs text-stone-500">
                        {cpt.nom_compte} • •••• {cpt.numero_masque}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      cpt.statut_connexion === "Connecte"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {cpt.statut_connexion === "Connecte"
                      ? `Connecté (${cpt.provider})`
                      : cpt.statut_connexion}
                  </span>
                </div>

                <p className="tabulaire mt-5 text-3xl font-black text-green-900">
                  {formatFCFA(cpt.solde_fcfa)}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Dernière synchro : {formatDateTimeFR(cpt.derniere_synchro)}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={() => handleRefreshCompte(cpt)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Actualiser le solde</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReleveCompte(cpt)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-green-700 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-900 hover:bg-green-100"
                >
                  <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Voir le relevé</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDisconnectCompte(cpt)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
                >
                  <Unplug className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Déconnecter</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Dernières transactions */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-stone-900">Historique des transactions</h2>
        <div className="table-wrapper mt-4">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Compte</th>
                <th className="py-3 pr-4">Motif</th>
                <th className="py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transactions.slice(0, 15).map((tx) => {
                const cpt = comptes.find((c) => c.id === tx.compte_id);
                const isIn = tx.type === "Entree";
                return (
                  <tr key={tx.id}>
                    <td className="py-3 pr-4 text-stone-600">{formatDateFR(tx.date)}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isIn ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {isIn ? (
                          <ArrowDownLeft className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        )}
                        {isIn ? "Entrée" : "Sortie"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium">{cpt?.nom_banque ?? "—"}</td>
                    <td className="py-3 pr-4">{tx.motif}</td>
                    <td
                      className={`tabulaire py-3 text-right font-bold ${
                        isIn ? "text-green-800" : "text-red-700"
                      }`}
                    >
                      {isIn ? "+" : "-"}
                      {formatFCFA(tx.montant_fcfa)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modale Connecter mon compte bancaire (3 options A / B / C) */}
      <ModalDialog
        open={openConnect}
        onClose={() => setOpenConnect(false)}
        title="Connecter mon compte bancaire"
      >
        <div className="space-y-5">
          {/* Choix A / B / C */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setConnectTab("A")}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold ${
                connectTab === "A"
                  ? "border-green-800 bg-green-50 text-green-900"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
            >
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <span>A) Sécurisée</span>
            </button>
            <button
              type="button"
              onClick={() => setConnectTab("B")}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold ${
                connectTab === "B"
                  ? "border-green-800 bg-green-50 text-green-900"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
            >
              <KeyRound className="h-5 w-5" aria-hidden="true" />
              <span>B) Clé API</span>
            </button>
            <button
              type="button"
              onClick={() => setConnectTab("C")}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold ${
                connectTab === "C"
                  ? "border-green-800 bg-green-50 text-green-900"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
            >
              <Wallet className="h-5 w-5" aria-hidden="true" />
              <span>C) Manuelle</span>
            </button>
          </div>

          {connectTab === "A" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-green-50 p-3.5 text-xs text-green-950">
                <strong>Connexion sécurisée via agrégateur :</strong> Vous vous connectez
                directement sur le portail officiel de votre banque. Nous ne stockons{" "}
                <strong>jamais</strong> votre mot de passe bancaire.
              </div>
              <div>
                <label htmlFor="agg-provider" className="block text-sm font-semibold">
                  Agrégateur bancaire
                </label>
                <select
                  id="agg-provider"
                  value={aggProvider}
                  onChange={(e) =>
                    setAggProvider(e.target.value as "Mono" | "Okra" | "Plaid" | "Bridge")
                  }
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
                >
                  <option value="Mono">Mono (Afrique)</option>
                  <option value="Okra">Okra (Afrique)</option>
                  <option value="Bridge">Bridge</option>
                  <option value="Plaid">Plaid</option>
                </select>
              </div>
              <div>
                <label htmlFor="agg-bank" className="block text-sm font-semibold">
                  Banque au Tchad
                </label>
                <select
                  id="agg-bank"
                  value={aggBank}
                  onChange={(e) => setAggBank(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
                >
                  {BANQUES_TCHAD.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleOptionA}
                disabled={aggLoading}
                className="min-h-[48px] w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900 disabled:opacity-60"
              >
                {aggLoading
                  ? "Connexion au portail bancaire..."
                  : `Ouvrir la fenêtre sécurisée ${aggProvider}`}
              </button>
            </div>
          )}

          {connectTab === "B" && (
            <form onSubmit={handleOptionB} className="space-y-4">
              <div>
                <label htmlFor="api-bank" className="block text-sm font-semibold">
                  Banque
                </label>
                <select
                  id="api-bank"
                  value={apiBank}
                  onChange={(e) => setApiBank(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
                >
                  {BANQUES_TCHAD.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="api-url" className="block text-sm font-semibold">
                  URL API de la banque (HTTPS)
                </label>
                <input
                  id="api-url"
                  type="url"
                  required
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
                />
              </div>
              <div>
                <label htmlFor="api-token" className="block text-sm font-semibold">
                  Clé API / Token fourni par la banque
                </label>
                <input
                  id="api-token"
                  type="password"
                  required
                  placeholder="Collez votre token API ici"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
                />
              </div>
              <div>
                <label htmlFor="api-mask" className="block text-sm font-semibold">
                  4 derniers chiffres du compte
                </label>
                <input
                  id="api-mask"
                  type="text"
                  maxLength={4}
                  pattern="\d{4}"
                  value={apiMask}
                  onChange={(e) => setApiMask(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
                />
              </div>
              {apiError && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800">
                  {apiError}
                </p>
              )}
              <button
                type="submit"
                disabled={apiTesting}
                className="min-h-[48px] w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900 disabled:opacity-60"
              >
                {apiTesting ? "Test de connexion..." : "Tester la connexion et enregistrer"}
              </button>
            </form>
          )}

          {connectTab === "C" && (
            <form onSubmit={handleOptionC} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="man-type" className="block text-sm font-semibold">
                    Type
                  </label>
                  <select
                    id="man-type"
                    value={manType}
                    onChange={(e) => setManType(e.target.value as TypeCompte)}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
                  >
                    <option value="Banque">Banque</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Caisse">Caisse</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="man-mask" className="block text-sm font-semibold">
                    4 derniers chiffres
                  </label>
                  <input
                    id="man-mask"
                    type="text"
                    maxLength={4}
                    value={manMask}
                    onChange={(e) => setManMask(e.target.value)}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="man-bank" className="block text-sm font-semibold">
                  Établissement / Opérateur
                </label>
                <select
                  id="man-bank"
                  value={manBank}
                  onChange={(e) => setManBank(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
                >
                  {TOUTES_BANQUES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="man-nom" className="block text-sm font-semibold">
                  Nom du compte
                </label>
                <input
                  id="man-nom"
                  type="text"
                  placeholder="Ex: Compte Ferme N'Djamena"
                  value={manNomCompte}
                  onChange={(e) => setManNomCompte(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
                />
              </div>
              <div>
                <label htmlFor="man-solde" className="block text-sm font-semibold">
                  Solde de départ (FCFA)
                </label>
                <input
                  id="man-solde"
                  type="number"
                  required
                  value={manSolde}
                  onChange={(e) => setManSolde(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
                />
              </div>
              <button
                type="submit"
                className="min-h-[48px] w-full rounded-xl bg-amber-800 px-4 py-3 text-sm font-bold text-white hover:bg-amber-900"
              >
                Enregistrer ce compte manuel
              </button>
            </form>
          )}
        </div>
      </ModalDialog>

      {/* Modale Voir le relevé */}
      <ModalDialog
        open={Boolean(releveCompte)}
        onClose={() => setReleveCompte(null)}
        title={`Relevé — ${releveCompte?.nom_banque ?? ""}`}
      >
        <div className="space-y-3">
          {releves.filter((r) => r.compte_id === releveCompte?.id).length === 0 ? (
            <p className="text-sm text-stone-600">
              Aucune ligne de relevé pour ce compte. Importez un relevé Excel / CSV pour
              l&apos;alimenter.
            </p>
          ) : (
            <div className="divide-y divide-stone-100">
              {releves
                .filter((r) => r.compte_id === releveCompte?.id)
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <p className="font-semibold text-stone-900">{r.libelle}</p>
                      <p className="text-xs text-stone-500">{formatDateFR(r.date)}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`tabulaire font-bold ${
                          r.montant_fcfa >= 0 ? "text-green-800" : "text-red-700"
                        }`}
                      >
                        {r.montant_fcfa >= 0 ? "+" : ""}
                        {formatFCFA(r.montant_fcfa)}
                      </p>
                      <p className="tabulaire text-xs text-stone-500">
                        Solde : {formatFCFA(r.solde_apres)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </ModalDialog>

      {/* Modale Import Relevé Excel / CSV */}
      <ModalDialog
        open={openImport}
        onClose={() => setOpenImport(false)}
        title="Importer un relevé bancaire Excel / CSV"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Le fichier doit contenir les colonnes : <strong>Date</strong>,{" "}
            <strong>Libelle</strong> et <strong>Montant</strong> (positif pour entrée,
            négatif pour sortie).
          </p>
          <div>
            <label htmlFor="imp-compte" className="block text-sm font-semibold">
              Compte bancaire concerné
            </label>
            <select
              id="imp-compte"
              value={importCompteId}
              onChange={(e) => setImportCompteId(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
            >
              {comptes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom_banque} (•••• {c.numero_masque})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="imp-file" className="block text-sm font-semibold">
              Fichier Excel (.xlsx, .xls) ou CSV
            </label>
            <input
              id="imp-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              disabled={importBusy}
              onChange={handleImportReleve}
              className="mt-1 block w-full rounded-xl border border-stone-300 p-2.5 text-sm"
            />
          </div>
        </div>
      </ModalDialog>

      {/* Modale Ajouter transaction manuelle */}
      <ModalDialog
        open={openTx}
        onClose={() => setOpenTx(false)}
        title="Ajouter une transaction manuelle"
      >
        <form onSubmit={handleAddTx} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-type" className="block text-sm font-semibold">
                Type
              </label>
              <select
                id="tx-type"
                value={txType}
                onChange={(e) => setTxType(e.target.value as TypeTransaction)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
              >
                <option value="Entree">Entrée (+)</option>
                <option value="Sortie">Sortie (-)</option>
              </select>
            </div>
            <div>
              <label htmlFor="tx-date" className="block text-sm font-semibold">
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
          </div>
          <div>
            <label htmlFor="tx-compte" className="block text-sm font-semibold">
              Compte concerné
            </label>
            <select
              id="tx-compte"
              value={txCompteId}
              onChange={(e) => setTxCompteId(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
            >
              {comptes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom_banque} — {formatFCFA(c.solde_fcfa)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tx-montant" className="block text-sm font-semibold">
              Montant (FCFA)
            </label>
            <input
              id="tx-montant"
              type="number"
              min="1"
              required
              placeholder="Ex: 50000"
              value={txMontant}
              onChange={(e) => setTxMontant(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div>
            <label htmlFor="tx-motif" className="block text-sm font-semibold">
              Motif
            </label>
            <input
              id="tx-motif"
              type="text"
              required
              placeholder="Ex: Achat carburant groupe électrogène"
              value={txMotif}
              onChange={(e) => setTxMotif(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900"
          >
            Enregistrer la transaction
          </button>
        </form>
      </ModalDialog>
    </div>
  );
}
