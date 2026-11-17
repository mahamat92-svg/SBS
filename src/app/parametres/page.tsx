"use client";

import React, { useEffect, useRef, useState } from "react";
import { Upload, Save, Building2 } from "lucide-react";
import { loadAllData, saveProfile, uploadStorageFile } from "@/lib/store";
import type { Profile } from "@/types/database";

export default function ParametresPage() {
  const [profile, setProfile] = useState<Profile>({
    id: "",
    nom_ferme: "Ferme Al-Baraka N'Djamena",
    logo_url: null,
    telephone_whatsapp: "+235 66 24 18 90",
    adresse: "Quartier Chagoua, Rue 40m",
    ville: "N'Djamena",
    pays: "Tchad",
    devise: "FCFA",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllData().then((res) => {
      setProfile(res.data.profile);
    });
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSavedMsg(null);
    try {
      const url = await uploadStorageFile("logos", file);
      const updated = await saveProfile({ ...profile, logo_url: url });
      setProfile(updated);
      setSavedMsg("Logo mis à jour ! Il apparaîtra sur toutes vos factures PDF, Excel et Impression.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    try {
      const updated = await saveProfile(profile);
      setProfile(updated);
      setSavedMsg("Paramètres de votre entreprise sauvegardés.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-green-950 sm:text-3xl">
          Paramètres / Mon Entreprise
        </h1>
        <p className="text-sm text-stone-600">
          Le logo et ces informations apparaissent automatiquement sur toutes vos factures
        </p>
      </div>

      {/* Section Logo */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-base font-bold text-stone-900">Logo de la ferme</h2>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          {profile.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logo_url}
              alt="Aperçu du logo"
              className="h-24 w-24 shrink-0 rounded-2xl border border-stone-200 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-stone-400">
              <Building2 className="h-8 w-8" aria-hidden="true" />
            </div>
          )}

          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>{uploading ? "Upload en cours..." : "Ajouter mon logo"}</span>
            </button>
            <p className="text-xs text-stone-500">
              Format PNG ou JPG recommandé (stocké dans Supabase Storage bucket{" "}
              <code>logos</code>).
            </p>
          </div>
        </div>
      </section>

      {savedMsg && (
        <div
          role="status"
          className="rounded-xl border border-green-300 bg-green-50 p-3.5 text-sm font-semibold text-green-900"
        >
          {savedMsg}
        </div>
      )}

      {/* Formulaire Entreprise */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6"
      >
        <div>
          <label htmlFor="ent-nom" className="block text-sm font-semibold">
            Nom de la ferme / entreprise
          </label>
          <input
            id="ent-nom"
            type="text"
            required
            value={profile.nom_ferme}
            onChange={(e) => setProfile({ ...profile, nom_ferme: e.target.value })}
            className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5"
          />
        </div>

        <div>
          <label htmlFor="ent-tel" className="block text-sm font-semibold">
            Téléphone WhatsApp
          </label>
          <input
            id="ent-tel"
            type="tel"
            required
            value={profile.telephone_whatsapp}
            onChange={(e) =>
              setProfile({ ...profile, telephone_whatsapp: e.target.value })
            }
            className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5"
          />
        </div>

        <div>
          <label htmlFor="ent-adr" className="block text-sm font-semibold">
            Adresse
          </label>
          <input
            id="ent-adr"
            type="text"
            required
            value={profile.adresse}
            onChange={(e) => setProfile({ ...profile, adresse: e.target.value })}
            className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ent-ville" className="block text-sm font-semibold">
              Ville
            </label>
            <input
              id="ent-ville"
              type="text"
              required
              value={profile.ville}
              onChange={(e) => setProfile({ ...profile, ville: e.target.value })}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5"
            />
          </div>
          <div>
            <label htmlFor="ent-pays" className="block text-sm font-semibold">
              Pays
            </label>
            <input
              id="ent-pays"
              type="text"
              required
              value={profile.pays}
              onChange={(e) => setProfile({ ...profile, pays: e.target.value })}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3.5"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900 disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>{saving ? "Sauvegarde..." : "Sauvegarder"}</span>
        </button>
      </form>
    </div>
  );
}
