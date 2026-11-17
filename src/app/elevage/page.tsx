"use client";

import React, { useEffect, useState } from "react";
import {
  Beef,
  Baby,
  Syringe,
  Wheat,
  Plus,
  Trash2,
  Pencil,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import ModalDialog from "@/components/ModalDialog";
import {
  deleteItem,
  insertItem,
  loadAllData,
  updateItem,
  uploadStorageFile,
} from "@/lib/store";
import { formatDateFR, formatFCFA, joursAvant, todayISO } from "@/lib/format";
import type {
  Aliment,
  Animal,
  Naissance,
  StatutAnimal,
  StatutVaccin,
  TypeAnimal,
  Vaccin,
} from "@/types/database";

export default function ElevagePage() {
  const [tab, setTab] = useState<"animaux" | "naissances" | "vaccins" | "aliments">("animaux");
  const [animaux, setAnimaux] = useState<Animal[]>([]);
  const [naissances, setNaissances] = useState<Naissance[]>([]);
  const [vaccins, setVaccins] = useState<Vaccin[]>([]);
  const [aliments, setAliments] = useState<Aliment[]>([]);

  // Modale Animal
  const [openAnimal, setOpenAnimal] = useState(false);
  const [editAnimalId, setEditAnimalId] = useState<string | null>(null);
  const [aBoucle, setABoucle] = useState("");
  const [aType, setAType] = useState<TypeAnimal>("vache");
  const [aSexe, setASexe] = useState<"Mâle" | "Femelle">("Femelle");
  const [aRace, setARace] = useState("Zébu Bororo");
  const [aDateNaiss, setADateNaiss] = useState("");
  const [aPoids, setAPoids] = useState("250");
  const [aStatut, setAStatut] = useState<StatutAnimal>("Vivant");
  const [aPhoto, setAPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Modale Naissance
  const [openNaiss, setOpenNaiss] = useState(false);
  const [nMereId, setNMereId] = useState("");
  const [nDate, setNDate] = useState(todayISO());
  const [nPetits, setNPetits] = useState("1");

  // Modale Vaccin
  const [openVaccin, setOpenVaccin] = useState(false);
  const [vAnimalId, setVAnimalId] = useState("");
  const [vNom, setVNom] = useState("");
  const [vDate, setVDate] = useState(todayISO());
  const [vRappel, setVRappel] = useState(todayISO());
  const [vStatut, setVStatut] = useState<StatutVaccin>("Fait");

  // Modale Aliment
  const [openAliment, setOpenAliment] = useState(false);
  const [alNom, setAlNom] = useState("");
  const [alSacs, setAlSacs] = useState("10");
  const [alCout, setAlCout] = useState("13500");
  const [alConso, setAlConso] = useState("1");

  async function refresh() {
    const res = await loadAllData();
    setAnimaux(res.data.animaux);
    setNaissances(res.data.naissances);
    setVaccins(res.data.vaccins);
    setAliments(res.data.aliments);
    if (res.data.animaux.length > 0) {
      setNMereId((p) => p || res.data.animaux[0].id);
      setVAnimalId((p) => p || res.data.animaux[0].id);
    }
  }

  useEffect(() => {
    let active = true;
    loadAllData().then((res) => {
      if (!active) return;
      setAnimaux(res.data.animaux);
      setNaissances(res.data.naissances);
      setVaccins(res.data.vaccins);
      setAliments(res.data.aliments);
      if (res.data.animaux.length > 0) {
        setNMereId((p) => p || res.data.animaux[0].id);
        setVAnimalId((p) => p || res.data.animaux[0].id);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function openNewAnimal() {
    setEditAnimalId(null);
    setABoucle(`TD-${String(animaux.length + 1).padStart(3, "0")}`);
    setAType("vache");
    setASexe("Femelle");
    setARace("Zébu Bororo");
    setADateNaiss("");
    setAPoids("250");
    setAStatut("Vivant");
    setAPhoto(null);
    setOpenAnimal(true);
  }

  function openEditAnimal(a: Animal) {
    setEditAnimalId(a.id);
    setABoucle(a.numero_boucle);
    setAType(a.type);
    setASexe(a.sexe);
    setARace(a.race);
    setADateNaiss(a.date_naissance ?? "");
    setAPoids(String(a.poids_kg));
    setAStatut(a.statut);
    setAPhoto(a.photo_url);
    setOpenAnimal(true);
  }

  async function handleAnimalPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadStorageFile("animaux", file);
      setAPhoto(url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveAnimal(e: React.FormEvent) {
    e.preventDefault();
    const payload: Omit<Animal, "id"> = {
      numero_boucle: aBoucle.trim(),
      type: aType,
      sexe: aSexe,
      race: aRace.trim(),
      date_naissance: aDateNaiss || null,
      poids_kg: Number(aPoids) || 0,
      photo_url: aPhoto,
      statut: aStatut,
    };
    if (editAnimalId) {
      await updateItem<Animal>("animaux", editAnimalId, payload);
    } else {
      await insertItem<Animal>("animaux", payload);
    }
    setOpenAnimal(false);
    await refresh();
  }

  async function handleSaveNaissance(e: React.FormEvent) {
    e.preventDefault();
    await insertItem<Naissance>("naissances", {
      mere_id: nMereId || null,
      date: nDate,
      nombre_petits: Number(nPetits) || 1,
      ajoute_au_troupeau: false,
    });
    setOpenNaiss(false);
    await refresh();
  }

  async function handleAjouterPetitsAuTroupeau(n: Naissance) {
    if (n.ajoute_au_troupeau) return;
    const mere = animaux.find((a) => a.id === n.mere_id);
    for (let i = 1; i <= n.nombre_petits; i++) {
      await insertItem<Animal>("animaux", {
        numero_boucle: `${mere?.numero_boucle ?? "TD"}-N${animaux.length + i}`,
        type: mere?.type ?? "mouton",
        sexe: i % 2 === 0 ? "Mâle" : "Femelle",
        race: mere?.race ?? "Locale",
        date_naissance: n.date,
        poids_kg: 12,
        photo_url: null,
        statut: "Vivant",
      });
    }
    await updateItem<Naissance>("naissances", n.id, { ajoute_au_troupeau: true });
    await refresh();
  }

  async function handleSaveVaccin(e: React.FormEvent) {
    e.preventDefault();
    await insertItem<Vaccin>("vaccins", {
      animal_id: vAnimalId,
      nom_vaccin: vNom.trim(),
      date_vaccin: vDate,
      date_rappel: vRappel,
      statut: vStatut,
    });
    setVNom("");
    setOpenVaccin(false);
    await refresh();
  }

  async function handleSaveAliment(e: React.FormEvent) {
    e.preventDefault();
    await insertItem<Aliment>("aliments", {
      nom: alNom.trim(),
      stock_sacs: Number(alSacs) || 0,
      cout_sac_fcfa: Number(alCout) || 0,
      consommation_jour: Number(alConso) || 0,
    });
    setAlNom("");
    setOpenAliment(false);
    await refresh();
  }

  const vivants = animaux.filter((a) => a.statut === "Vivant").length;
  const coutJourTotal = aliments.reduce(
    (acc, al) => acc + Number(al.cout_sac_fcfa) * Number(al.consommation_jour),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-green-950 sm:text-3xl">
          Module Élevage
        </h1>
        <p className="text-sm text-stone-600">
          {vivants} animal(aux) vivant(s) • Coût alimentation / jour :{" "}
          <strong className="text-amber-900">{formatFCFA(coutJourTotal)}</strong>
        </p>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "animaux" as const, label: `Animaux (${animaux.length})`, Icon: Beef },
          { id: "naissances" as const, label: `Naissances (${naissances.length})`, Icon: Baby },
          { id: "vaccins" as const, label: `Vaccins (${vaccins.length})`, Icon: Syringe },
          { id: "aliments" as const, label: `Alimentation (${aliments.length})`, Icon: Wheat },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
              tab === t.id
                ? "bg-green-800 text-white"
                : "border border-stone-200 bg-white text-stone-700"
            }`}
          >
            <t.Icon className="h-4 w-4" aria-hidden="true" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB ANIMAUX */}
      {tab === "animaux" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openNewAnimal}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Ajouter un animal</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {animaux.map((a) => (
              <article
                key={a.id}
                className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5"
              >
                <div>
                  <div className="flex items-start gap-3">
                    {a.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.photo_url}
                        alt={a.numero_boucle}
                        className="h-16 w-16 shrink-0 rounded-xl border border-stone-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                        <Beef className="h-7 w-7" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-extrabold text-green-950">{a.numero_boucle}</h2>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            a.statut === "Vivant"
                              ? "bg-green-100 text-green-800"
                              : a.statut === "Vendu"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {a.statut}
                        </span>
                      </div>
                      <p className="text-sm font-semibold capitalize text-amber-900">
                        {a.type} • {a.sexe}
                      </p>
                      <p className="text-xs text-stone-500">
                        Race : {a.race} • {a.poids_kg} kg
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-stone-100 pt-3">
                  <button
                    type="button"
                    onClick={() => openEditAnimal(a)}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-stone-300 px-3 text-xs font-bold text-stone-700"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Modifier</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteItem("animaux", a.id);
                      await refresh();
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700"
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

      {/* TAB NAISSANCES */}
      {tab === "naissances" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpenNaiss(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Enregistrer une naissance</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {naissances.map((n) => {
              const mere = animaux.find((a) => a.id === n.mere_id);
              return (
                <article
                  key={n.id}
                  className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5"
                >
                  <div>
                    <p className="text-xs font-bold uppercase text-amber-800">
                      {formatDateFR(n.date)}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-stone-900">
                      Mère : {mere?.numero_boucle ?? "Inconnue"} ({mere?.type ?? "—"})
                    </h2>
                    <p className="mt-1 text-sm text-stone-600">
                      Nombre de petits : <strong>{n.nombre_petits}</strong>
                    </p>
                  </div>
                  <div className="mt-4">
                    {n.ajoute_au_troupeau ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-100 px-3 py-2 text-xs font-bold text-green-800">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        <span>Ajouté(s) au troupeau</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAjouterPetitsAuTroupeau(n)}
                        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-amber-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-900"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        <span>Ajouter les petits au troupeau</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB VACCINS */}
      {tab === "vaccins" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpenVaccin(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Planifier / Enregistrer un vaccin</span>
            </button>
          </div>

          <div className="space-y-3">
            {vaccins.map((v) => {
              const animal = animaux.find((a) => a.id === v.animal_id);
              const urgent = v.statut !== "Fait" && joursAvant(v.date_rappel) <= 3;
              return (
                <article
                  key={v.id}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${
                    urgent ? "border-red-300 bg-red-50" : "border-stone-200 bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-stone-900">{v.nom_vaccin}</h2>
                      {urgent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          Rappel dans ≤ 3 jours
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-stone-600">
                      Animal : <strong>{animal?.numero_boucle ?? "—"}</strong> • Vacciné le{" "}
                      {formatDateFR(v.date_vaccin)} • Rappel :{" "}
                      <strong>{formatDateFR(v.date_rappel)}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.statut === "À faire" ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await updateItem<Vaccin>("vaccins", v.id, { statut: "Fait" });
                          await refresh();
                        }}
                        className="min-h-[40px] rounded-xl bg-green-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-green-900"
                      >
                        Marquer Fait
                      </button>
                    ) : (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                        Fait
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteItem("vaccins", v.id);
                        await refresh();
                      }}
                      aria-label="Supprimer vaccin"
                      className="rounded-lg p-2 text-red-700 hover:bg-red-100"
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

      {/* TAB ALIMENTATION */}
      {tab === "aliments" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpenAliment(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-800 px-4 py-2 text-sm font-bold text-white hover:bg-amber-900"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Ajouter un aliment</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {aliments.map((al) => {
              const coutJour = Number(al.cout_sac_fcfa) * Number(al.consommation_jour);
              return (
                <article
                  key={al.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-bold text-stone-900">{al.nom}</h2>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteItem("aliments", al.id);
                        await refresh();
                      }}
                      aria-label="Supprimer aliment"
                      className="rounded-lg p-1.5 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-stone-50 p-3">
                      <p className="text-xs text-stone-500">Stock sacs</p>
                      <p className="tabulaire font-extrabold text-stone-900">
                        {al.stock_sacs} sacs
                      </p>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3">
                      <p className="text-xs text-stone-500">Coût du sac</p>
                      <p className="tabulaire font-extrabold text-stone-900">
                        {formatFCFA(al.cout_sac_fcfa)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3">
                      <p className="text-xs text-stone-500">Conso / jour</p>
                      <p className="tabulaire font-extrabold text-stone-900">
                        {al.consommation_jour} sac(s)
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="text-xs text-amber-900">Coût / jour auto</p>
                      <p className="tabulaire font-extrabold text-amber-950">
                        {formatFCFA(coutJour)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Modale Animal */}
      <ModalDialog
        open={openAnimal}
        onClose={() => setOpenAnimal(false)}
        title={editAnimalId ? "Modifier l'animal" : "Nouvel animal"}
      >
        <form onSubmit={handleSaveAnimal} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="a-boucle" className="block text-sm font-semibold">
                N° Boucle
              </label>
              <input
                id="a-boucle"
                type="text"
                required
                value={aBoucle}
                onChange={(e) => setABoucle(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="a-type" className="block text-sm font-semibold">
                Type
              </label>
              <select
                id="a-type"
                value={aType}
                onChange={(e) => setAType(e.target.value as TypeAnimal)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
              >
                <option value="vache">Vache</option>
                <option value="boeuf">Boeuf</option>
                <option value="mouton">Mouton</option>
                <option value="chevre">Chèvre</option>
                <option value="poulet">Poulet</option>
                <option value="porc">Porc</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="a-sexe" className="block text-sm font-semibold">
                Sexe
              </label>
              <select
                id="a-sexe"
                value={aSexe}
                onChange={(e) => setASexe(e.target.value as "Mâle" | "Femelle")}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
              >
                <option value="Femelle">Femelle</option>
                <option value="Mâle">Mâle</option>
              </select>
            </div>
            <div>
              <label htmlFor="a-poids" className="block text-sm font-semibold">
                Poids (kg)
              </label>
              <input
                id="a-poids"
                type="number"
                min="0"
                required
                value={aPoids}
                onChange={(e) => setAPoids(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="a-race" className="block text-sm font-semibold">
                Race
              </label>
              <input
                id="a-race"
                type="text"
                required
                value={aRace}
                onChange={(e) => setARace(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="a-statut" className="block text-sm font-semibold">
                Statut
              </label>
              <select
                id="a-statut"
                value={aStatut}
                onChange={(e) => setAStatut(e.target.value as StatutAnimal)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
              >
                <option value="Vivant">Vivant</option>
                <option value="Vendu">Vendu</option>
                <option value="Mort">Mort</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="a-date" className="block text-sm font-semibold">
              Date de naissance
            </label>
            <input
              id="a-date"
              type="date"
              value={aDateNaiss}
              onChange={(e) => setADateNaiss(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div>
            <label htmlFor="a-photo" className="block text-sm font-semibold">
              Photo (Supabase Storage)
            </label>
            <input
              id="a-photo"
              type="file"
              accept="image/*"
              onChange={handleAnimalPhoto}
              className="mt-1 block w-full rounded-xl border border-stone-300 p-2 text-sm"
            />
            {uploading && <p className="mt-1 text-xs text-stone-500">Upload en cours...</p>}
          </div>
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900"
          >
            Enregistrer l&apos;animal
          </button>
        </form>
      </ModalDialog>

      {/* Modale Naissance */}
      <ModalDialog
        open={openNaiss}
        onClose={() => setOpenNaiss(false)}
        title="Nouvelle naissance"
      >
        <form onSubmit={handleSaveNaissance} className="space-y-4">
          <div>
            <label htmlFor="n-mere" className="block text-sm font-semibold">
              Mère
            </label>
            <select
              id="n-mere"
              value={nMereId}
              onChange={(e) => setNMereId(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
            >
              {animaux.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.numero_boucle} ({a.type} - {a.race})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="n-date" className="block text-sm font-semibold">
                Date
              </label>
              <input
                id="n-date"
                type="date"
                required
                value={nDate}
                onChange={(e) => setNDate(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="n-petits" className="block text-sm font-semibold">
                Nombre de petits
              </label>
              <input
                id="n-petits"
                type="number"
                min="1"
                required
                value={nPetits}
                onChange={(e) => setNPetits(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
          </div>
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900"
          >
            Enregistrer la naissance
          </button>
        </form>
      </ModalDialog>

      {/* Modale Vaccin */}
      <ModalDialog
        open={openVaccin}
        onClose={() => setOpenVaccin(false)}
        title="Nouveau vaccin"
      >
        <form onSubmit={handleSaveVaccin} className="space-y-4">
          <div>
            <label htmlFor="v-ani" className="block text-sm font-semibold">
              Animal
            </label>
            <select
              id="v-ani"
              required
              value={vAnimalId}
              onChange={(e) => setVAnimalId(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
            >
              {animaux.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.numero_boucle} ({a.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="v-nom" className="block text-sm font-semibold">
              Nom du vaccin
            </label>
            <input
              id="v-nom"
              type="text"
              required
              placeholder="Ex: PPCB / PPR / Charbon"
              value={vNom}
              onChange={(e) => setVNom(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="v-date" className="block text-sm font-semibold">
                Date vaccin
              </label>
              <input
                id="v-date"
                type="date"
                required
                value={vDate}
                onChange={(e) => setVDate(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="v-rappel" className="block text-sm font-semibold">
                Date rappel
              </label>
              <input
                id="v-rappel"
                type="date"
                required
                value={vRappel}
                onChange={(e) => setVRappel(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
          </div>
          <div>
            <label htmlFor="v-statut" className="block text-sm font-semibold">
              Statut
            </label>
            <select
              id="v-statut"
              value={vStatut}
              onChange={(e) => setVStatut(e.target.value as StatutVaccin)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
            >
              <option value="Fait">Fait</option>
              <option value="À faire">À faire</option>
            </select>
          </div>
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900"
          >
            Enregistrer le vaccin
          </button>
        </form>
      </ModalDialog>

      {/* Modale Aliment */}
      <ModalDialog
        open={openAliment}
        onClose={() => setOpenAliment(false)}
        title="Nouvel aliment bétail"
      >
        <form onSubmit={handleSaveAliment} className="space-y-4">
          <div>
            <label htmlFor="al-nom" className="block text-sm font-semibold">
              Nom de l&apos;aliment
            </label>
            <input
              id="al-nom"
              type="text"
              required
              placeholder="Ex: Tourteau de coton 50kg"
              value={alNom}
              onChange={(e) => setAlNom(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="al-sacs" className="block text-xs font-semibold">
                Stock sacs
              </label>
              <input
                id="al-sacs"
                type="number"
                required
                value={alSacs}
                onChange={(e) => setAlSacs(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="al-cout" className="block text-xs font-semibold">
                Coût sac FCFA
              </label>
              <input
                id="al-cout"
                type="number"
                required
                value={alCout}
                onChange={(e) => setAlCout(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="al-conso" className="block text-xs font-semibold">
                Sacs / jour
              </label>
              <input
                id="al-conso"
                type="number"
                step="0.1"
                required
                value={alConso}
                onChange={(e) => setAlConso(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
          </div>
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-amber-800 px-4 py-3 text-sm font-bold text-white hover:bg-amber-900"
          >
            Enregistrer l&apos;aliment
          </button>
        </form>
      </ModalDialog>
    </div>
  );
}
