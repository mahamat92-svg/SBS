"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileSpreadsheet,
  FileDown,
  MessageCircle,
  Printer,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { loadAllData, markFactureAsPaid } from "@/lib/store";
import { exportFactureExcel } from "@/lib/export-excel";
import { exportFacturePDF } from "@/lib/export-pdf";
import { buildWhatsAppUrl, formatDateFR, formatFCFA } from "@/lib/format";
import type { Client, CompteBancaire, Facture, Profile } from "@/types/database";

export default function FactureDetailPage() {
  const params = useParams<{ id: string }>();
  const [facture, setFacture] = useState<Facture | null>(null);
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [compte, setCompte] = useState<CompteBancaire | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [payingMobile, setPayingMobile] = useState(false);

  async function refresh() {
    setLoading(true);
    const res = await loadAllData();
    const fac = res.data.factures.find((f) => f.id === params.id) ?? null;
    setFacture(fac);
    setProfile(res.data.profile);
    if (fac) {
      setClient(res.data.clients.find((c) => c.id === fac.client_id));
      setCompte(res.data.comptes_bancaires.find((c) => c.id === fac.compte_id));
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    loadAllData().then((res) => {
      if (!active) return;
      const fac = res.data.factures.find((f) => f.id === params.id) ?? null;
      setFacture(fac);
      setProfile(res.data.profile);
      if (fac) {
        setClient(res.data.clients.find((c) => c.id === fac.client_id));
        setCompte(res.data.comptes_bancaires.find((c) => c.id === fac.compte_id));
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />;
  }

  if (!facture || !profile) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <p className="font-bold text-stone-800">Facture introuvable.</p>
        <Link href="/factures" className="mt-3 inline-block text-sm font-bold text-green-800 underline">
          Retour aux factures
        </Link>
      </div>
    );
  }

  async function handleMarkPaid() {
    if (!facture) return;
    await markFactureAsPaid(facture);
    setMsg("Facture marquée comme Payée ! Le solde du compte a été mis à jour.");
    await refresh();
  }

  async function handleWhatsApp() {
    if (!facture || !profile) return;
    // Télécharge le PDF pour que l'utilisateur puisse le joindre dans WhatsApp
    await exportFacturePDF(facture, client, profile);
    const nomClient = client?.nom ?? "Client";
    const text = `Bonjour ${nomClient}, voici votre facture N°${facture.numero} de ${formatFCFA(
      facture.total_fcfa
    )} de ${profile.nom_ferme}. Merci. Payez par Airtel Money / Moov Money / Virement.`;
    const url = buildWhatsAppUrl(client?.telephone_whatsapp ?? "", text);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleMobilePay() {
    if (!facture) return;
    setPayingMobile(true);
    setMsg(null);
    try {
      const res = await fetch("/api/paiement/initier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facture_id: facture.id,
          numero: facture.numero,
          montant_fcfa: facture.total_fcfa,
          telephone: client?.telephone_whatsapp ?? "",
          operateur:
            facture.mode_paiement === "Moov Money Tchad"
              ? "Moov Money Tchad"
              : "Airtel Money Tchad",
        }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string; payment_url?: string | null };
      if (json.payment_url) {
        window.open(json.payment_url, "_blank", "noopener,noreferrer");
      }
      setMsg(json.message ?? "Demande Mobile Money envoyée.");
    } finally {
      setPayingMobile(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Barre d'actions masquée à l'impression */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/factures"
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Retour</span>
        </Link>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportFactureExcel(facture, client, profile)}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-green-800 bg-green-50 px-3.5 py-2 text-xs font-bold text-green-900 hover:bg-green-100"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>Exporter Excel</span>
          </button>

          <button
            type="button"
            onClick={() => exportFacturePDF(facture, client, profile)}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-amber-800 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            <span>Exporter PDF</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-green-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-green-800"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>Envoyer sur WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>Imprimer</span>
          </button>

          {facture.statut !== "Payee" && (
            <>
              <button
                type="button"
                onClick={handleMobilePay}
                disabled={payingMobile}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-amber-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-800 disabled:opacity-60"
              >
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                <span>{payingMobile ? "Envoi..." : "Payer Airtel / Moov"}</span>
              </button>
              <button
                type="button"
                onClick={handleMarkPaid}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-green-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-green-950"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Marquer comme Payée</span>
              </button>
            </>
          )}
        </div>
      </div>

      {msg && (
        <div
          role="status"
          className="no-print rounded-xl border border-green-300 bg-green-50 p-3.5 text-sm font-semibold text-green-900"
        >
          {msg}
        </div>
      )}

      {/* Feuille Facture PRO */}
      <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
        {/* En-tête : Logo en haut à gauche + Coordonnées + N° Facture */}
        <div className="flex flex-col justify-between gap-6 border-b border-stone-200 pb-6 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            {profile.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logo_url}
                alt={profile.nom_ferme}
                className="h-20 w-20 shrink-0 rounded-xl border border-stone-200 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-green-900 text-2xl font-black text-white">
                AE
              </div>
            )}
            <div>
              <h1 className="text-xl font-extrabold text-green-950 sm:text-2xl">
                {profile.nom_ferme}
              </h1>
              <p className="mt-1 text-sm text-stone-600">{profile.adresse}</p>
              <p className="text-sm text-stone-600">
                {profile.ville}, {profile.pays}
              </p>
              <p className="text-sm font-semibold text-amber-900">
                WhatsApp : {profile.telephone_whatsapp}
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Facture officielle
            </p>
            <p className="mt-1 text-2xl font-black text-stone-900">{facture.numero}</p>
            <p className="mt-1 text-sm text-stone-600">
              Date : {formatDateFR(facture.date)}
            </p>
            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                facture.statut === "Payee"
                  ? "bg-green-100 text-green-800"
                  : facture.statut === "Impayee"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-900"
              }`}
            >
              {facture.statut === "Payee"
                ? "PAYÉE"
                : facture.statut === "Impayee"
                  ? "IMPAYÉE"
                  : facture.statut}
            </span>
          </div>
        </div>

        {/* Client + Paiement */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-stone-50 p-4">
            <p className="text-xs font-bold uppercase text-stone-500">Facturé à</p>
            <p className="mt-1 text-base font-bold text-stone-900">
              {client?.nom ?? "Client comptoir"}
            </p>
            {client?.telephone_whatsapp && (
              <p className="text-sm text-stone-600">Tél : {client.telephone_whatsapp}</p>
            )}
            {client?.ville && (
              <p className="text-sm text-stone-600">Ville : {client.ville}</p>
            )}
          </div>

          <div className="rounded-xl bg-stone-50 p-4">
            <p className="text-xs font-bold uppercase text-stone-500">
              Règlement & Compte
            </p>
            <p className="mt-1 text-base font-bold text-stone-900">
              {facture.mode_paiement}
            </p>
            {compte && (
              <p className="text-sm text-stone-600">
                Compte : {compte.nom_banque} (•••• {compte.numero_masque})
              </p>
            )}
          </div>
        </div>

        {/* Tableau lignes */}
        <div className="table-wrapper mt-6">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-green-900 bg-green-900 text-white">
                <th className="rounded-tl-lg px-4 py-3">Désignation</th>
                <th className="px-4 py-3 text-right">Quantité</th>
                <th className="px-4 py-3 text-right">Prix (FCFA)</th>
                <th className="rounded-tr-lg px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {(facture.lignes ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-medium text-stone-900">{l.designation}</td>
                  <td className="tabulaire px-4 py-3 text-right">{l.quantite}</td>
                  <td className="tabulaire px-4 py-3 text-right">{formatFCFA(l.prix_fcfa)}</td>
                  <td className="tabulaire px-4 py-3 text-right font-bold">
                    {formatFCFA(l.total_ligne)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="mt-6 flex flex-col items-end space-y-1.5 border-t border-stone-200 pt-5">
          <p className="text-sm text-stone-600">
            Sous-total : <span className="tabulaire font-bold">{formatFCFA(facture.sous_total)}</span>
          </p>
          <p className="text-sm text-stone-600">
            Remise : <span className="tabulaire font-bold">{formatFCFA(facture.remise)}</span>
          </p>
          <div className="mt-2 rounded-xl bg-green-900 px-5 py-3 text-white">
            <span className="text-xs font-bold uppercase tracking-wider text-green-200">
              Total à payer
            </span>
            <p className="tabulaire text-2xl font-black sm:text-3xl">
              {formatFCFA(facture.total_fcfa)}
            </p>
          </div>
        </div>

        {/* Mention & Signature */}
        <div className="mt-10 flex flex-col justify-between gap-6 border-t border-stone-200 pt-6 sm:flex-row sm:items-end">
          <div className="text-xs text-stone-600">
            <p className="font-bold text-stone-800">
              Mode de paiement : {facture.mode_paiement}
            </p>
            <p className="mt-1">
              Merci pour votre confiance. Paiement en FCFA (XAF) — {profile.ville}, {profile.pays}.
            </p>
          </div>
          <div className="w-56 border-t border-stone-400 pt-2 text-center text-xs font-semibold text-stone-600">
            Signature & Cachet — {profile.nom_ferme}
          </div>
        </div>
      </article>
    </div>
  );
}
