"use client";

import React, { useEffect, useRef, useState } from "react";
import { Plus, Trash2, FileSpreadsheet, Upload } from "lucide-react";
import ModalDialog from "@/components/ModalDialog";
import { deleteItem, insertItem, loadAllData } from "@/lib/store";
import { exportProduitsExcel, parseProduitsExcel } from "@/lib/export-excel";
import { formatFCFA } from "@/lib/format";
import type { CategorieProduit, Produit, UniteProduit } from "@/types/database";

export default function ProduitsPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState<CategorieProduit>("agriculture");
  const [prix, setPrix] = useState("15000");
  const [stock, setStock] = useState("10");
  const [unite, setUnite] = useState<UniteProduit>("sac");
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const res = await loadAllData();
    setProduits(res.data.produits);
  }

  useEffect(() => {
    let active = true;
    loadAllData().then((res) => {
      if (active) setProduits(res.data.produits);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await insertItem<Produit>("produits", {
      nom: nom.trim(),
      categorie,
      prix_fcfa: Number(prix) || 0,
      stock: Number(stock) || 0,
      unite,
      seuil_alerte: 5,
    });
    setNom("");
    setOpen(false);
    await refresh();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = await parseProduitsExcel(file);
    for (const r of rows) {
      await insertItem<Produit>("produits", r);
    }
    setMsg(`${rows.length} produit(s) importé(s) depuis Excel.`);
    e.target.value = "";
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-green-950 sm:text-3xl">
            Catalogue Produits
          </h1>
          <p className="text-sm text-stone-600">
            Agriculture & Élevage — Prix en FCFA (XAF)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-800 hover:bg-stone-50"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>Importer depuis Excel</span>
          </button>
          <button
            type="button"
            onClick={() => exportProduitsExcel(produits)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-800 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-950 hover:bg-amber-100"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>Exporter en Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Ajouter un produit</span>
          </button>
        </div>
      </div>

      {msg && (
        <div
          role="status"
          className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm font-semibold text-green-900"
        >
          {msg}
        </div>
      )}

      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="table-wrapper">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <th className="py-3 pr-4">Produit</th>
                <th className="py-3 pr-4">Catégorie</th>
                <th className="py-3 pr-4 text-right">Prix FCFA</th>
                <th className="py-3 pr-4 text-right">Stock</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {produits.map((p) => (
                <tr key={p.id}>
                  <td className="py-3.5 pr-4 font-bold text-stone-900">{p.nom}</td>
                  <td className="py-3.5 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                        p.categorie === "agriculture"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {p.categorie}
                    </span>
                  </td>
                  <td className="tabulaire py-3.5 pr-4 text-right font-bold text-green-900">
                    {formatFCFA(p.prix_fcfa)}
                  </td>
                  <td className="tabulaire py-3.5 pr-4 text-right">
                    <span
                      className={
                        p.stock <= p.seuil_alerte
                          ? "font-bold text-red-700"
                          : "font-semibold text-stone-800"
                      }
                    >
                      {p.stock} {p.unite}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteItem("produits", p.id);
                        await refresh();
                      }}
                      aria-label="Supprimer produit"
                      className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalDialog open={open} onClose={() => setOpen(false)} title="Nouveau produit">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label htmlFor="pr-nom" className="block text-sm font-semibold">
              Nom du produit
            </label>
            <input
              id="pr-nom"
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pr-cat" className="block text-sm font-semibold">
                Catégorie
              </label>
              <select
                id="pr-cat"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value as CategorieProduit)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
              >
                <option value="agriculture">Agriculture</option>
                <option value="elevage">Élevage</option>
              </select>
            </div>
            <div>
              <label htmlFor="pr-unite" className="block text-sm font-semibold">
                Unité
              </label>
              <select
                id="pr-unite"
                value={unite}
                onChange={(e) => setUnite(e.target.value as UniteProduit)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
              >
                <option value="sac">sac</option>
                <option value="kg">kg</option>
                <option value="tete">tête</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pr-prix" className="block text-sm font-semibold">
                Prix (FCFA)
              </label>
              <input
                id="pr-prix"
                type="number"
                min="0"
                required
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="pr-stock" className="block text-sm font-semibold">
                Stock initial
              </label>
              <input
                id="pr-stock"
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
          </div>
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900"
          >
            Enregistrer le produit
          </button>
        </form>
      </ModalDialog>
    </div>
  );
}
