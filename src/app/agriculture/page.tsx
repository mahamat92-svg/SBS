"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, AlertTriangle, Sprout, Wheat, FlaskConical } from "lucide-react";
import ModalDialog from "@/components/ModalDialog";
import { deleteItem, insertItem, loadAllData, updateItem } from "@/lib/store";
import { formatDateFR, formatFCFA, todayISO } from "@/lib/format";
import {
  CULTURES_TCHAD,
  type CategorieIntrant,
  type Intrant,
  type Parcelle,
  type Recolte,
} from "@/types/database";

export default function AgriculturePage() {
  const [tab, setTab] = useState<"parcelles" | "recoltes" | "intrants">("parcelles");
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [recoltes, setRecoltes] = useState<Recolte[]>([]);
  const [intrants, setIntrants] = useState<Intrant[]>([]);

  // Modale Parcelle
  const [openParcelle, setOpenParcelle] = useState(false);
  const [editParcelleId, setEditParcelleId] = useState<string | null>(null);
  const [pNom, setPNom] = useState("");
  const [pHa, setPHa] = useState("2");
  const [pCulture, setPCulture] = useState<string>("Maïs");
  const [pLoc, setPLoc] = useState("N'Djamena");
  const [pStatut, setPStatut] = useState("En culture");

  // Modale Récolte
  const [openRecolte, setOpenRecolte] = useState(false);
  const [rParcelleId, setRParcelleId] = useState("");
  const [rDate, setRDate] = useState(todayISO());
  const [rKg, setRKg] = useState("1000");
  const [rPrix, setRPrix] = useState("185");

  // Modale Intrant
  const [openIntrant, setOpenIntrant] = useState(false);
  const [iNom, setINom] = useState("");
  const [iCat, setICat] = useState<CategorieIntrant>("Engrais");
  const [iQte, setIQte] = useState("10");
  const [iUnite, setIUnite] = useState("sac 50kg");
  const [iSeuil, setISeuil] = useState("5");
  const [iCout, setICout] = useState("20000");

  async function refresh() {
    const res = await loadAllData();
    setParcelles(res.data.parcelles);
    setRecoltes(res.data.recoltes);
    setIntrants(res.data.intrants);
    if (res.data.parcelles.length > 0 && !rParcelleId) {
      setRParcelleId(res.data.parcelles[0].id);
    }
  }

  useEffect(() => {
    let active = true;
    loadAllData().then((res) => {
      if (!active) return;
      setParcelles(res.data.parcelles);
      setRecoltes(res.data.recoltes);
      setIntrants(res.data.intrants);
      if (res.data.parcelles.length > 0) {
        setRParcelleId((prev) => prev || res.data.parcelles[0].id);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function openNewParcelle() {
    setEditParcelleId(null);
    setPNom("");
    setPHa("2");
    setPCulture("Maïs");
    setPLoc("N'Djamena");
    setPStatut("En culture");
    setOpenParcelle(true);
  }

  function openEditParcelle(p: Parcelle) {
    setEditParcelleId(p.id);
    setPNom(p.nom);
    setPHa(String(p.superficie_ha));
    setPCulture(p.culture);
    setPLoc(p.localisation);
    setPStatut(p.statut);
    setOpenParcelle(true);
  }

  async function handleSaveParcelle(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      nom: pNom.trim(),
      superficie_ha: Number(pHa) || 0,
      culture: pCulture,
      localisation: pLoc.trim(),
      statut: pStatut,
    };
    if (editParcelleId) {
      await updateItem<Parcelle>("parcelles", editParcelleId, payload);
    } else {
      await insertItem<Parcelle>("parcelles", payload);
    }
    setOpenParcelle(false);
    await refresh();
  }

  async function handleSaveRecolte(e: React.FormEvent) {
    e.preventDefault();
    if (!rParcelleId) return;
    await insertItem<Recolte>("recoltes", {
      parcelle_id: rParcelleId,
      date: rDate,
      quantite_kg: Number(rKg) || 0,
      prix_vente_fcfa: Number(rPrix) || 0,
    });
    setOpenRecolte(false);
    await refresh();
  }

  async function handleSaveIntrant(e: React.FormEvent) {
    e.preventDefault();
    await insertItem<Intrant>("intrants", {
      nom: iNom.trim(),
      categorie: iCat,
      quantite: Number(iQte) || 0,
      unite: iUnite.trim() || "sac",
      seuil_alerte: Number(iSeuil) || 5,
      cout_unitaire_fcfa: Number(iCout) || 0,
    });
    setINom("");
    setOpenIntrant(false);
    await refresh();
  }

  const totalHa = parcelles.reduce((a, p) => a + Number(p.superficie_ha), 0);
  const totalRecolteFCFA = recoltes.reduce(
    (a, r) => a + Number(r.quantite_kg) * Number(r.prix_vente_fcfa),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-green-950 sm:text-3xl">
            Module Agriculture
          </h1>
          <p className="text-sm text-stone-600">
            {totalHa} ha exploités • Valeur récoltes :{" "}
            <strong className="text-green-900">{formatFCFA(totalRecolteFCFA)}</strong>
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("parcelles")}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
            tab === "parcelles"
              ? "bg-green-800 text-white"
              : "border border-stone-200 bg-white text-stone-700"
          }`}
        >
          <Sprout className="h-4 w-4" aria-hidden="true" />
          <span>Parcelles ({parcelles.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("recoltes")}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
            tab === "recoltes"
              ? "bg-green-800 text-white"
              : "border border-stone-200 bg-white text-stone-700"
          }`}
        >
          <Wheat className="h-4 w-4" aria-hidden="true" />
          <span>Récoltes ({recoltes.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("intrants")}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
            tab === "intrants"
              ? "bg-green-800 text-white"
              : "border border-stone-200 bg-white text-stone-700"
          }`}
        >
          <FlaskConical className="h-4 w-4" aria-hidden="true" />
          <span>Stock Intrants ({intrants.length})</span>
        </button>
      </div>

      {/* TAB PARCELLES */}
      {tab === "parcelles" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openNewParcelle}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Ajouter une parcelle</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parcelles.map((p) => (
              <article
                key={p.id}
                className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-bold text-green-950">{p.nom}</h2>
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                      {p.statut}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-amber-800">
                    Culture : {p.culture}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Superficie : <strong>{p.superficie_ha} ha</strong>
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Localisation : {p.localisation}
                  </p>
                </div>
                <div className="mt-4 flex gap-2 border-t border-stone-100 pt-3">
                  <button
                    type="button"
                    onClick={() => openEditParcelle(p)}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-stone-300 px-3 text-xs font-bold text-stone-700 hover:bg-stone-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Modifier</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteItem("parcelles", p.id);
                      await refresh();
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* TAB RÉCOLTES */}
      {tab === "recoltes" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpenRecolte(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Enregistrer une récolte</span>
            </button>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="table-wrapper">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Parcelle</th>
                    <th className="py-3 pr-4 text-right">Quantité (kg)</th>
                    <th className="py-3 pr-4 text-right">Prix / kg</th>
                    <th className="py-3 pr-4 text-right">Total auto</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recoltes.map((r) => {
                    const parc = parcelles.find((p) => p.id === r.parcelle_id);
                    const total = Number(r.quantite_kg) * Number(r.prix_vente_fcfa);
                    return (
                      <tr key={r.id}>
                        <td className="py-3 pr-4">{formatDateFR(r.date)}</td>
                        <td className="py-3 pr-4 font-bold text-green-900">
                          {parc?.nom ?? "—"} ({parc?.culture ?? ""})
                        </td>
                        <td className="tabulaire py-3 pr-4 text-right">
                          {r.quantite_kg.toLocaleString("fr-FR")} kg
                        </td>
                        <td className="tabulaire py-3 pr-4 text-right">
                          {formatFCFA(r.prix_vente_fcfa)}
                        </td>
                        <td className="tabulaire py-3 pr-4 text-right font-extrabold text-green-800">
                          {formatFCFA(total)}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteItem("recoltes", r.id);
                              await refresh();
                            }}
                            aria-label="Supprimer récolte"
                            className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB STOCK INTRANTS */}
      {tab === "intrants" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpenIntrant(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-800 px-4 py-2 text-sm font-bold text-white hover:bg-amber-900"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Ajouter un intrant</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {intrants.map((i) => {
              const bas = Number(i.quantite) <= Number(i.seuil_alerte);
              return (
                <article
                  key={i.id}
                  className={`rounded-2xl border p-5 ${
                    bas ? "border-red-300 bg-red-50" : "border-stone-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase text-amber-800">
                        {i.categorie}
                      </span>
                      <h2 className="mt-1 text-base font-bold text-stone-900">{i.nom}</h2>
                    </div>
                    {bas && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        Stock bas
                      </span>
                    )}
                  </div>
                  <p className="tabulaire mt-3 text-2xl font-black text-stone-900">
                    {i.quantite} {i.unite}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    Coût unitaire : {formatFCFA(i.cout_unitaire_fcfa)} • Seuil : {i.seuil_alerte}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateItem<Intrant>("intrants", i.id, {
                          quantite: Number(i.quantite) + 1,
                        });
                        await refresh();
                      }}
                      className="min-h-[36px] rounded-lg border border-stone-300 bg-white px-3 text-xs font-bold"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await updateItem<Intrant>("intrants", i.id, {
                          quantite: Math.max(0, Number(i.quantite) - 1),
                        });
                        await refresh();
                      }}
                      className="min-h-[36px] rounded-lg border border-stone-300 bg-white px-3 text-xs font-bold"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteItem("intrants", i.id);
                        await refresh();
                      }}
                      aria-label="Supprimer intrant"
                      className="ml-auto rounded-lg p-2 text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Modale Parcelle */}
      <ModalDialog
        open={openParcelle}
        onClose={() => setOpenParcelle(false)}
        title={editParcelleId ? "Modifier la parcelle" : "Nouvelle parcelle"}
      >
        <form onSubmit={handleSaveParcelle} className="space-y-4">
          <div>
            <label htmlFor="p-nom" className="block text-sm font-semibold">
              Nom de la parcelle
            </label>
            <input
              id="p-nom"
              type="text"
              required
              value={pNom}
              onChange={(e) => setPNom(e.target.value)}
              placeholder="Ex: Parcelle Sud Koundoul"
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="p-ha" className="block text-sm font-semibold">
                Superficie (ha)
              </label>
              <input
                id="p-ha"
                type="number"
                step="0.1"
                min="0.1"
                required
                value={pHa}
                onChange={(e) => setPHa(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="p-cult" className="block text-sm font-semibold">
                Culture
              </label>
              <select
                id="p-cult"
                value={pCulture}
                onChange={(e) => setPCulture(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
              >
                {CULTURES_TCHAD.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="p-loc" className="block text-sm font-semibold">
              Localisation
            </label>
            <input
              id="p-loc"
              type="text"
              required
              value={pLoc}
              onChange={(e) => setPLoc(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div>
            <label htmlFor="p-statut" className="block text-sm font-semibold">
              Statut
            </label>
            <select
              id="p-statut"
              value={pStatut}
              onChange={(e) => setPStatut(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
            >
              <option value="En culture">En culture</option>
              <option value="Préparation">Préparation</option>
              <option value="Récoltée">Récoltée</option>
              <option value="Jachère">Jachère</option>
            </select>
          </div>
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900"
          >
            Enregistrer la parcelle
          </button>
        </form>
      </ModalDialog>

      {/* Modale Récolte */}
      <ModalDialog
        open={openRecolte}
        onClose={() => setOpenRecolte(false)}
        title="Enregistrer une récolte"
      >
        <form onSubmit={handleSaveRecolte} className="space-y-4">
          <div>
            <label htmlFor="r-parc" className="block text-sm font-semibold">
              Parcelle
            </label>
            <select
              id="r-parc"
              required
              value={rParcelleId}
              onChange={(e) => setRParcelleId(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
            >
              {parcelles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.culture})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="r-date" className="block text-sm font-semibold">
              Date de récolte
            </label>
            <input
              id="r-date"
              type="date"
              required
              value={rDate}
              onChange={(e) => setRDate(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="r-kg" className="block text-sm font-semibold">
                Quantité (kg)
              </label>
              <input
                id="r-kg"
                type="number"
                min="1"
                required
                value={rKg}
                onChange={(e) => setRKg(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="r-prix" className="block text-sm font-semibold">
                Prix vente / kg (FCFA)
              </label>
              <input
                id="r-prix"
                type="number"
                min="0"
                required
                value={rPrix}
                onChange={(e) => setRPrix(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
          </div>
          <p className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-900">
            Total automatique : {formatFCFA((Number(rKg) || 0) * (Number(rPrix) || 0))}
          </p>
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900"
          >
            Enregistrer la récolte
          </button>
        </form>
      </ModalDialog>

      {/* Modale Intrant */}
      <ModalDialog
        open={openIntrant}
        onClose={() => setOpenIntrant(false)}
        title="Nouvel intrant agricole"
      >
        <form onSubmit={handleSaveIntrant} className="space-y-4">
          <div>
            <label htmlFor="i-nom" className="block text-sm font-semibold">
              Nom de l&apos;intrant
            </label>
            <input
              id="i-nom"
              type="text"
              required
              value={iNom}
              onChange={(e) => setINom(e.target.value)}
              placeholder="Ex: Urée 46%"
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="i-cat" className="block text-sm font-semibold">
                Catégorie
              </label>
              <select
                id="i-cat"
                value={iCat}
                onChange={(e) => setICat(e.target.value as CategorieIntrant)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
              >
                <option value="Engrais">Engrais</option>
                <option value="Semences">Semences</option>
                <option value="Pesticides">Pesticides</option>
              </select>
            </div>
            <div>
              <label htmlFor="i-unite" className="block text-sm font-semibold">
                Unité
              </label>
              <input
                id="i-unite"
                type="text"
                required
                value={iUnite}
                onChange={(e) => setIUnite(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="i-qte" className="block text-xs font-semibold">
                Quantité
              </label>
              <input
                id="i-qte"
                type="number"
                required
                value={iQte}
                onChange={(e) => setIQte(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="i-seuil" className="block text-xs font-semibold">
                Seuil alerte
              </label>
              <input
                id="i-seuil"
                type="number"
                required
                value={iSeuil}
                onChange={(e) => setISeuil(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="i-cout" className="block text-xs font-semibold">
                Coût FCFA
              </label>
              <input
                id="i-cout"
                type="number"
                required
                value={iCout}
                onChange={(e) => setICout(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
          </div>
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-amber-800 px-4 py-3 text-sm font-bold text-white hover:bg-amber-900"
          >
            Ajouter au stock
          </button>
        </form>
      </ModalDialog>
    </div>
  );
}
