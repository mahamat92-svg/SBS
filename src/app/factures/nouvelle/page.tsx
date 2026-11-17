"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { createFactureWithLignes, loadAllData } from "@/lib/store";
import { formatFCFA, todayISO } from "@/lib/format";
import {
  MOBILE_MONEY_TCHAD,
  type Client,
  type CompteBancaire,
  type ModePaiement,
  type Produit,
  type StatutFacture,
} from "@/types/database";

interface LigneDraft {
  produit_id: string;
  designation: string;
  quantite: number;
  prix_fcfa: number;
}

export default function NouvelleFacturePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [comptes, setComptes] = useState<CompteBancaire[]>([]);

  const [numero, setNumero] = useState(
    () => `FAC-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`
  );
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [modePaiement, setModePaiement] = useState<ModePaiement>("Airtel Money Tchad");
  const [compteId, setCompteId] = useState("");
  const [statut, setStatut] = useState<StatutFacture>("Impayee");
  const [remiseType, setRemiseType] = useState<"FCFA" | "%">("FCFA");
  const [remiseVal, setRemiseVal] = useState("0");
  const [lignes, setLignes] = useState<LigneDraft[]>([
    { produit_id: "", designation: "", quantite: 1, prix_fcfa: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllData().then((res) => {
      setClients(res.data.clients);
      setProduits(res.data.produits);
      setComptes(res.data.comptes_bancaires);
      if (res.data.clients.length > 0) setClientId(res.data.clients[0].id);
      if (res.data.comptes_bancaires.length > 0) setCompteId(res.data.comptes_bancaires[0].id);
      if (res.data.produits.length > 0) {
        const p = res.data.produits[0];
        setLignes([
          {
            produit_id: p.id,
            designation: p.nom,
            quantite: 1,
            prix_fcfa: Number(p.prix_fcfa),
          },
        ]);
      }
    });
  }, []);

  function updateLigne(index: number, patch: Partial<LigneDraft>) {
    setLignes((prev) =>
      prev.map((l, idx) => (idx === index ? { ...l, ...patch } : l))
    );
  }

  function handleSelectProduit(index: number, prodId: string) {
    const p = produits.find((x) => x.id === prodId);
    if (!p) {
      updateLigne(index, { produit_id: "" });
      return;
    }
    updateLigne(index, {
      produit_id: p.id,
      designation: p.nom,
      prix_fcfa: Number(p.prix_fcfa),
    });
  }

  const sousTotal = lignes.reduce(
    (acc, l) => acc + Number(l.quantite) * Number(l.prix_fcfa),
    0
  );
  const remiseNum = Number(remiseVal) || 0;
  const remiseFCFA =
    remiseType === "%" ? Math.round((sousTotal * remiseNum) / 100) : remiseNum;
  const totalFCFA = Math.max(0, sousTotal - remiseFCFA);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const validLignes = lignes
        .filter((l) => l.designation.trim() && l.quantite > 0)
        .map((l) => ({
          produit_id: l.produit_id || null,
          designation: l.designation.trim(),
          quantite: Number(l.quantite),
          prix_fcfa: Number(l.prix_fcfa),
          total_ligne: Number(l.quantite) * Number(l.prix_fcfa),
        }));

      const created = await createFactureWithLignes(
        {
          numero,
          client_id: clientId || null,
          date,
          sous_total: sousTotal,
          remise: remiseFCFA,
          total_fcfa: totalFCFA,
          statut,
          mode_paiement: modePaiement,
          compte_id: compteId || null,
        },
        validLignes
      );

      router.push(`/factures/${created.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/factures"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
          aria-label="Retour aux factures"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-green-950">Nouvelle facture</h1>
          <p className="text-sm text-stone-600">Calcul automatique en FCFA (XAF)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="fac-num" className="block text-sm font-semibold">
              N° Facture
            </label>
            <input
              id="fac-num"
              type="text"
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div>
            <label htmlFor="fac-date" className="block text-sm font-semibold">
              Date
            </label>
            <input
              id="fac-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div>
            <label htmlFor="fac-client" className="block text-sm font-semibold">
              Client
            </label>
            <select
              id="fac-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
            >
              <option value="">Client comptoir</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.ville})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fac-mode" className="block text-sm font-semibold">
              Mode de paiement
            </label>
            <select
              id="fac-mode"
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
            >
              {MOBILE_MONEY_TCHAD.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fac-compte" className="block text-sm font-semibold">
              Compte à créditer
            </label>
            <select
              id="fac-compte"
              value={compteId}
              onChange={(e) => setCompteId(e.target.value)}
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
            <label htmlFor="fac-statut" className="block text-sm font-semibold">
              Statut initial
            </label>
            <select
              id="fac-statut"
              value={statut}
              onChange={(e) => setStatut(e.target.value as StatutFacture)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
            >
              <option value="Brouillon">Brouillon</option>
              <option value="Envoyee">Envoyée</option>
              <option value="Impayee">Impayée</option>
              <option value="Payee">Payée (crédite le compte)</option>
            </select>
          </div>
        </div>

        {/* Lignes de facture */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-stone-900">Lignes de la facture</h2>
            <button
              type="button"
              onClick={() =>
                setLignes((prev) => [
                  ...prev,
                  { produit_id: "", designation: "", quantite: 1, prix_fcfa: 0 },
                ])
              }
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-amber-800 px-3 py-2 text-xs font-bold text-white hover:bg-amber-900"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Ajouter une ligne</span>
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {lignes.map((l, idx) => (
              <div
                key={idx}
                className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3.5 md:grid-cols-[1.2fr_1.5fr_0.7fr_1fr_auto] md:items-end"
              >
                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    Produit catalogue
                  </label>
                  <select
                    value={l.produit_id}
                    onChange={(e) => handleSelectProduit(idx, e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-2.5 text-sm"
                  >
                    <option value="">-- Saisie libre --</option>
                    {produits.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom} ({formatFCFA(p.prix_fcfa)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    Désignation
                  </label>
                  <input
                    type="text"
                    required
                    value={l.designation}
                    onChange={(e) => updateLigne(idx, { designation: e.target.value })}
                    placeholder="Nom du produit ou service"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    Quantité
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={l.quantite}
                    onChange={(e) => updateLigne(idx, { quantite: Number(e.target.value) })}
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600">
                    Prix unitaire (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={l.prix_fcfa}
                    onChange={(e) => updateLigne(idx, { prix_fcfa: Number(e.target.value) })}
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-2.5 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 md:justify-end">
                  <span className="tabulaire text-sm font-bold text-green-900">
                    {formatFCFA(Number(l.quantite) * Number(l.prix_fcfa))}
                  </span>
                  {lignes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLignes((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Supprimer la ligne"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totaux et Remise */}
        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-end">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="rem-type" className="block text-sm font-semibold">
                Type de remise
              </label>
              <select
                id="rem-type"
                value={remiseType}
                onChange={(e) => setRemiseType(e.target.value as "FCFA" | "%")}
                className="mt-1 min-h-[48px] rounded-xl border border-stone-300 bg-white px-3"
              >
                <option value="FCFA">FCFA</option>
                <option value="%">Pourcentage (%)</option>
              </select>
            </div>
            <div>
              <label htmlFor="rem-val" className="block text-sm font-semibold">
                Remise
              </label>
              <input
                id="rem-val"
                type="number"
                min="0"
                value={remiseVal}
                onChange={(e) => setRemiseVal(e.target.value)}
                className="mt-1 min-h-[48px] w-36 rounded-xl border border-stone-300 px-3"
              />
            </div>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-sm text-stone-600">
              Sous-total : <strong className="tabulaire">{formatFCFA(sousTotal)}</strong>
            </p>
            <p className="text-sm text-stone-600">
              Remise : <strong className="tabulaire">- {formatFCFA(remiseFCFA)}</strong>
            </p>
            <p className="tabulaire text-2xl font-black text-green-900">
              TOTAL : {formatFCFA(totalFCFA)}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-6 py-3.5 text-base font-bold text-white hover:bg-green-900 disabled:opacity-60"
        >
          <Save className="h-5 w-5" aria-hidden="true" />
          <span>{saving ? "Enregistrement..." : "Enregistrer la facture"}</span>
        </button>
      </form>
    </div>
  );
}
