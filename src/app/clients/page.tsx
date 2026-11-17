"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, MessageCircle, Users } from "lucide-react";
import ModalDialog from "@/components/ModalDialog";
import { deleteItem, insertItem, loadAllData } from "@/lib/store";
import { buildWhatsAppUrl } from "@/lib/format";
import type { Client, TypeClient } from "@/types/database";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("+235 ");
  const [ville, setVille] = useState("N'Djamena");
  const [type, setType] = useState<TypeClient>("Acheteur");

  async function refresh() {
    const res = await loadAllData();
    setClients(res.data.clients);
  }

  useEffect(() => {
    let active = true;
    loadAllData().then((res) => {
      if (active) setClients(res.data.clients);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await insertItem<Client>("clients", {
      nom: nom.trim(),
      telephone_whatsapp: tel.trim(),
      ville: ville.trim(),
      type,
    });
    setNom("");
    setTel("+235 ");
    setOpen(false);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-green-950 sm:text-3xl">
            Clients & Fournisseurs
          </h1>
          <p className="text-sm text-stone-600">
            Répertoire Tchad avec contact WhatsApp direct
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Ajouter un client</span>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => (
          <article
            key={c.id}
            className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-900">
                    <Users className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-bold text-stone-900">{c.nom}</h2>
                    <p className="text-xs text-stone-500">{c.ville}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    c.type === "Acheteur"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {c.type}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-stone-700">
                WhatsApp : {c.telephone_whatsapp || "—"}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-3">
              <a
                href={buildWhatsAppUrl(
                  c.telephone_whatsapp,
                  `Bonjour ${c.nom}, ici AgriElevage Tchad Pro.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-700 px-3 text-xs font-bold text-white hover:bg-green-800"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>Appeler WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={async () => {
                  await deleteItem("clients", c.id);
                  await refresh();
                }}
                aria-label="Supprimer client"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <ModalDialog open={open} onClose={() => setOpen(false)} title="Nouveau client">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label htmlFor="c-nom" className="block text-sm font-semibold">
              Nom complet / Entreprise
            </label>
            <input
              id="c-nom"
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div>
            <label htmlFor="c-tel" className="block text-sm font-semibold">
              Téléphone WhatsApp
            </label>
            <input
              id="c-tel"
              type="tel"
              required
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="c-ville" className="block text-sm font-semibold">
                Ville
              </label>
              <input
                id="c-ville"
                type="text"
                required
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 px-3"
              />
            </div>
            <div>
              <label htmlFor="c-type" className="block text-sm font-semibold">
                Type
              </label>
              <select
                id="c-type"
                value={type}
                onChange={(e) => setType(e.target.value as TypeClient)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3"
              >
                <option value="Acheteur">Acheteur</option>
                <option value="Fournisseur">Fournisseur</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900"
          >
            Enregistrer le client
          </button>
        </form>
      </ModalDialog>
    </div>
  );
}
