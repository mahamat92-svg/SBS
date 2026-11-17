"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createInitialDemoState, type DemoStoreState } from "@/lib/demo-data";
import type {
  Aliment,
  Animal,
  Client,
  CompteBancaire,
  Facture,
  FactureLigne,
  Intrant,
  Naissance,
  Parcelle,
  Produit,
  Profile,
  Recolte,
  ReleveBancaire,
  Transaction,
  Vaccin,
} from "@/types/database";

const STORAGE_KEY = "agrielevage_tchad_pro_v1";

function readDemoState(): DemoStoreState {
  if (typeof window === "undefined") return createInitialDemoState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialDemoState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as DemoStoreState;
  } catch {
    return createInitialDemoState();
  }
}

function writeDemoState(state: DemoStoreState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function loadAllData(): Promise<{
  mode: "supabase" | "demo";
  data: DemoStoreState;
  userEmail: string | null;
}> {
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    return { mode: "demo", data: readDemoState(), userEmail: "admin@ferme-tchad.td" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { mode: "supabase", data: createInitialDemoState(), userEmail: null };
  }

  const [
    profileRes,
    clientsRes,
    produitsRes,
    comptesRes,
    relevesRes,
    facturesRes,
    lignesRes,
    txRes,
    parcellesRes,
    recoltesRes,
    intrantsRes,
    animauxRes,
    naissancesRes,
    vaccinsRes,
    alimentsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("produits").select("*").order("created_at", { ascending: false }),
    supabase.from("comptes_bancaires").select("*").order("created_at", { ascending: true }),
    supabase.from("releves_bancaires").select("*").order("date", { ascending: false }),
    supabase.from("factures").select("*").order("date", { ascending: false }),
    supabase.from("facture_lignes").select("*"),
    supabase.from("transactions").select("*").order("date", { ascending: false }),
    supabase.from("parcelles").select("*").order("created_at", { ascending: false }),
    supabase.from("recoltes").select("*").order("date", { ascending: false }),
    supabase.from("intrants").select("*").order("created_at", { ascending: false }),
    supabase.from("animaux").select("*").order("created_at", { ascending: false }),
    supabase.from("naissances").select("*").order("date", { ascending: false }),
    supabase.from("vaccins").select("*").order("date_rappel", { ascending: true }),
    supabase.from("aliments").select("*").order("created_at", { ascending: false }),
  ]);

  const lignesByFacture = new Map<string, FactureLigne[]>();
  for (const l of (lignesRes.data ?? []) as FactureLigne[]) {
    const arr = lignesByFacture.get(l.facture_id) ?? [];
    arr.push(l);
    lignesByFacture.set(l.facture_id, arr);
  }

  const factures = ((facturesRes.data ?? []) as Facture[]).map((f) => ({
    ...f,
    lignes: lignesByFacture.get(f.id) ?? [],
  }));

  const profile: Profile = (profileRes.data as Profile | null) ?? {
    id: user.id,
    nom_ferme: "Ferme AgriElevage Tchad",
    logo_url: null,
    telephone_whatsapp: "+235 66 00 00 00",
    adresse: "Quartier Chagoua, N'Djamena",
    ville: "N'Djamena",
    pays: "Tchad",
    devise: "FCFA",
  };

  return {
    mode: "supabase",
    userEmail: user.email ?? null,
    data: {
      profile,
      clients: (clientsRes.data ?? []) as Client[],
      produits: (produitsRes.data ?? []) as Produit[],
      comptes_bancaires: (comptesRes.data ?? []) as CompteBancaire[],
      releves_bancaires: (relevesRes.data ?? []) as ReleveBancaire[],
      factures,
      transactions: (txRes.data ?? []) as Transaction[],
      parcelles: (parcellesRes.data ?? []) as Parcelle[],
      recoltes: (recoltesRes.data ?? []) as Recolte[],
      intrants: (intrantsRes.data ?? []) as Intrant[],
      animaux: (animauxRes.data ?? []) as Animal[],
      naissances: (naissancesRes.data ?? []) as Naissance[],
      vaccins: (vaccinsRes.data ?? []) as Vaccin[],
      aliments: (alimentsRes.data ?? []) as Aliment[],
    },
  };
}

export async function saveProfile(profile: Partial<Profile>): Promise<Profile> {
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    const state = readDemoState();
    state.profile = { ...state.profile, ...profile };
    writeDemoState(state);
    return state.profile;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const payload = { ...profile, id: user.id, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function uploadStorageFile(
  bucket: "logos" | "animaux",
  file: File
): Promise<string> {
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsDataURL(file);
    });
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

type TableKey = keyof Omit<DemoStoreState, "profile">;

export async function insertItem<T extends { id?: string }>(
  table: TableKey,
  item: Omit<T, "id">
): Promise<T> {
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    const state = readDemoState();
    const created = { ...item, id: uid(table) } as T;
    (state[table] as unknown as T[]).unshift(created);
    writeDemoState(state);
    return created;
  }

  const { data, error } = await supabase.from(table).insert(item as never).select().single();
  if (error) throw error;
  return data as T;
}

export async function updateItem<T extends { id: string }>(
  table: TableKey,
  id: string,
  patch: Partial<T>
): Promise<T> {
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    const state = readDemoState();
    const list = state[table] as unknown as T[];
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error("Élément introuvable");
    list[idx] = { ...list[idx], ...patch };
    writeDemoState(state);
    return list[idx];
  }

  const { data, error } = await supabase
    .from(table)
    .update(patch as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as T;
}

export async function deleteItem(table: TableKey, id: string): Promise<void> {
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    const state = readDemoState();
    const list = state[table] as unknown as { id: string }[];
    const filtered = list.filter((x) => x.id !== id);
    (state[table] as unknown as { id: string }[]) = filtered;
    writeDemoState(state);
    return;
  }

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function createFactureWithLignes(
  facture: Omit<Facture, "id" | "lignes">,
  lignes: Omit<FactureLigne, "id" | "facture_id">[]
): Promise<Facture> {
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    const state = readDemoState();
    const factureId = uid("fac");
    const lignesFull: FactureLigne[] = lignes.map((l) => ({
      ...l,
      id: uid("fl"),
      facture_id: factureId,
    }));
    const created: Facture = { ...facture, id: factureId, lignes: lignesFull };
    state.factures.unshift(created);

    // Si créée directement en Payée, mettre à jour le compte et créer une transaction
    if (created.statut === "Payee") {
      applyFacturePaymentInDemo(state, created);
    }

    writeDemoState(state);
    return created;
  }

  const { data: facData, error: facErr } = await supabase
    .from("factures")
    .insert(facture)
    .select()
    .single();
  if (facErr) throw facErr;

  const createdFac = facData as Facture;
  if (lignes.length > 0) {
    const rows = lignes.map((l) => ({ ...l, facture_id: createdFac.id }));
    const { data: lData, error: lErr } = await supabase
      .from("facture_lignes")
      .insert(rows)
      .select();
    if (lErr) throw lErr;
    createdFac.lignes = lData as FactureLigne[];
  } else {
    createdFac.lignes = [];
  }

  if (createdFac.statut === "Payee") {
    await recordFacturePaymentSupabase(supabase, createdFac);
  }

  return createdFac;
}

function applyFacturePaymentInDemo(state: DemoStoreState, fac: Facture) {
  if (fac.compte_id) {
    const cpt = state.comptes_bancaires.find((c) => c.id === fac.compte_id);
    if (cpt) {
      cpt.solde_fcfa = Number(cpt.solde_fcfa) + Number(fac.total_fcfa);
      cpt.derniere_synchro = new Date().toISOString();
    }
  }
  state.transactions.unshift({
    id: uid("tx"),
    compte_id: fac.compte_id,
    type: "Entree",
    montant_fcfa: Number(fac.total_fcfa),
    motif: `Règlement facture ${fac.numero}`,
    date: new Date().toISOString().slice(0, 10),
    facture_id: fac.id,
  });
}

async function recordFacturePaymentSupabase(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  fac: Facture
) {
  if (fac.compte_id) {
    const { data: cpt } = await supabase
      .from("comptes_bancaires")
      .select("solde_fcfa")
      .eq("id", fac.compte_id)
      .single();
    if (cpt) {
      const nouveauSolde = Number(cpt.solde_fcfa) + Number(fac.total_fcfa);
      await supabase
        .from("comptes_bancaires")
        .update({ solde_fcfa: nouveauSolde, derniere_synchro: new Date().toISOString() })
        .eq("id", fac.compte_id);
    }
  }
  await supabase.from("transactions").insert({
    compte_id: fac.compte_id,
    type: "Entree",
    montant_fcfa: Number(fac.total_fcfa),
    motif: `Règlement facture ${fac.numero}`,
    date: new Date().toISOString().slice(0, 10),
    facture_id: fac.id,
  });
}

export async function markFactureAsPaid(facture: Facture): Promise<void> {
  if (facture.statut === "Payee") return;
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    const state = readDemoState();
    const target = state.factures.find((f) => f.id === facture.id);
    if (!target) return;
    target.statut = "Payee";
    applyFacturePaymentInDemo(state, target);
    writeDemoState(state);
    return;
  }

  const { error } = await supabase
    .from("factures")
    .update({ statut: "Payee" })
    .eq("id", facture.id);
  if (error) throw error;
  await recordFacturePaymentSupabase(supabase, facture);
}

export async function addManualTransaction(tx: Omit<Transaction, "id">): Promise<void> {
  const supabase = createClient();
  const delta = tx.type === "Entree" ? Number(tx.montant_fcfa) : -Number(tx.montant_fcfa);

  if (!supabase || !isSupabaseConfigured()) {
    const state = readDemoState();
    state.transactions.unshift({ ...tx, id: uid("tx") });
    if (tx.compte_id) {
      const cpt = state.comptes_bancaires.find((c) => c.id === tx.compte_id);
      if (cpt) {
        cpt.solde_fcfa = Number(cpt.solde_fcfa) + delta;
        cpt.derniere_synchro = new Date().toISOString();
      }
    }
    writeDemoState(state);
    return;
  }

  const { error } = await supabase.from("transactions").insert(tx);
  if (error) throw error;

  if (tx.compte_id) {
    const { data: cpt } = await supabase
      .from("comptes_bancaires")
      .select("solde_fcfa")
      .eq("id", tx.compte_id)
      .single();
    if (cpt) {
      await supabase
        .from("comptes_bancaires")
        .update({
          solde_fcfa: Number(cpt.solde_fcfa) + delta,
          derniere_synchro: new Date().toISOString(),
        })
        .eq("id", tx.compte_id);
    }
  }
}

export async function importReleveRows(
  compteId: string,
  rows: { date: string; libelle: string; montant_fcfa: number }[]
): Promise<number> {
  if (rows.length === 0) return 0;
  const supabase = createClient();

  if (!supabase || !isSupabaseConfigured()) {
    const state = readDemoState();
    const cpt = state.comptes_bancaires.find((c) => c.id === compteId);
    let solde = cpt ? Number(cpt.solde_fcfa) : 0;
    for (const r of rows) {
      solde += Number(r.montant_fcfa);
      state.releves_bancaires.unshift({
        id: uid("rel"),
        compte_id: compteId,
        date: r.date,
        libelle: r.libelle,
        montant_fcfa: Number(r.montant_fcfa),
        solde_apres: solde,
      });
    }
    if (cpt) {
      cpt.solde_fcfa = solde;
      cpt.derniere_synchro = new Date().toISOString();
    }
    writeDemoState(state);
    return rows.length;
  }

  const { data: cpt } = await supabase
    .from("comptes_bancaires")
    .select("solde_fcfa")
    .eq("id", compteId)
    .single();
  let solde = cpt ? Number(cpt.solde_fcfa) : 0;

  const inserts = rows.map((r) => {
    solde += Number(r.montant_fcfa);
    return {
      compte_id: compteId,
      date: r.date,
      libelle: r.libelle,
      montant_fcfa: Number(r.montant_fcfa),
      solde_apres: solde,
    };
  });

  const { error } = await supabase.from("releves_bancaires").insert(inserts);
  if (error) throw error;

  await supabase
    .from("comptes_bancaires")
    .update({ solde_fcfa: solde, derniere_synchro: new Date().toISOString() })
    .eq("id", compteId);

  return rows.length;
}
