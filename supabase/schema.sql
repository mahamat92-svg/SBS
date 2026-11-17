-- ============================================================================
-- AgriElevage Tchad Pro — Schéma SQL complet Supabase (PostgreSQL + RLS + Storage)
-- ============================================================================
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase.
-- Il crée toutes les tables, active Row Level Security (RLS) sur chacune,
-- configure les buckets Storage (logos, animaux) et les politiques d'accès.

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES (Mon Entreprise / Ferme)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_ferme TEXT NOT NULL DEFAULT 'Ferme AgriElevage Tchad',
  logo_url TEXT,
  telephone_whatsapp TEXT NOT NULL DEFAULT '+235 66 00 00 00',
  adresse TEXT NOT NULL DEFAULT 'Quartier Chagoua, N''Djamena',
  ville TEXT NOT NULL DEFAULT 'N''Djamena',
  pays TEXT NOT NULL DEFAULT 'Tchad',
  devise TEXT NOT NULL DEFAULT 'FCFA',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin voit son propre profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin insère son propre profil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin modifie son propre profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. CLIENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  nom TEXT NOT NULL,
  telephone_whatsapp TEXT NOT NULL DEFAULT '',
  ville TEXT NOT NULL DEFAULT 'N''Djamena',
  type TEXT NOT NULL CHECK (type IN ('Acheteur', 'Fournisseur')) DEFAULT 'Acheteur',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients RLS select" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Clients RLS insert" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Clients RLS update" ON public.clients FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Clients RLS delete" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. PRODUITS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.produits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL CHECK (categorie IN ('agriculture', 'elevage')) DEFAULT 'agriculture',
  prix_fcfa NUMERIC(14, 0) NOT NULL DEFAULT 0,
  stock NUMERIC(14, 2) NOT NULL DEFAULT 0,
  unite TEXT NOT NULL CHECK (unite IN ('kg', 'sac', 'tete')) DEFAULT 'sac',
  seuil_alerte NUMERIC(14, 2) NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produits RLS select" ON public.produits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Produits RLS insert" ON public.produits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Produits RLS update" ON public.produits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Produits RLS delete" ON public.produits FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 4. COMPTES BANCAIRES / MOBILE MONEY / CAISSE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comptes_bancaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  type TEXT NOT NULL CHECK (type IN ('Banque', 'Mobile Money', 'Caisse')) DEFAULT 'Banque',
  nom_banque TEXT NOT NULL,
  nom_compte TEXT NOT NULL,
  numero_masque TEXT NOT NULL DEFAULT '****',
  solde_fcfa NUMERIC(14, 0) NOT NULL DEFAULT 0,
  derniere_synchro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  statut_connexion TEXT NOT NULL CHECK (statut_connexion IN ('Connecte', 'Non connecte', 'Manuel')) DEFAULT 'Manuel',
  provider TEXT NOT NULL DEFAULT 'Manuel',
  api_url TEXT,
  -- Référence vers Supabase Vault ou secret serveur (jamais de mot de passe en clair ici)
  vault_secret_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comptes_bancaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comptes RLS select" ON public.comptes_bancaires FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Comptes RLS insert" ON public.comptes_bancaires FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comptes RLS update" ON public.comptes_bancaires FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comptes RLS delete" ON public.comptes_bancaires FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. RELEVÉS BANCAIRES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.releves_bancaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  compte_id UUID NOT NULL REFERENCES public.comptes_bancaires(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  libelle TEXT NOT NULL,
  montant_fcfa NUMERIC(14, 0) NOT NULL DEFAULT 0,
  solde_apres NUMERIC(14, 0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.releves_bancaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Releves RLS select" ON public.releves_bancaires FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Releves RLS insert" ON public.releves_bancaires FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Releves RLS update" ON public.releves_bancaires FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Releves RLS delete" ON public.releves_bancaires FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 6. FACTURES & LIGNES DE FACTURE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.factures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  numero TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sous_total NUMERIC(14, 0) NOT NULL DEFAULT 0,
  remise NUMERIC(14, 0) NOT NULL DEFAULT 0,
  total_fcfa NUMERIC(14, 0) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL CHECK (statut IN ('Brouillon', 'Envoyee', 'Payee', 'Impayee')) DEFAULT 'Brouillon',
  mode_paiement TEXT NOT NULL DEFAULT 'Airtel Money Tchad',
  compte_id UUID REFERENCES public.comptes_bancaires(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Factures RLS select" ON public.factures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Factures RLS insert" ON public.factures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Factures RLS update" ON public.factures FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Factures RLS delete" ON public.factures FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.facture_lignes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES public.produits(id) ON DELETE SET NULL,
  designation TEXT NOT NULL DEFAULT '',
  quantite NUMERIC(14, 2) NOT NULL DEFAULT 1,
  prix_fcfa NUMERIC(14, 0) NOT NULL DEFAULT 0,
  total_ligne NUMERIC(14, 0) NOT NULL DEFAULT 0
);

ALTER TABLE public.facture_lignes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Facture lignes RLS select" ON public.facture_lignes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Facture lignes RLS insert" ON public.facture_lignes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Facture lignes RLS update" ON public.facture_lignes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Facture lignes RLS delete" ON public.facture_lignes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. TRANSACTIONS (ENTRÉES / SORTIES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  compte_id UUID REFERENCES public.comptes_bancaires(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('Entree', 'Sortie')) DEFAULT 'Entree',
  montant_fcfa NUMERIC(14, 0) NOT NULL DEFAULT 0,
  motif TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  facture_id UUID REFERENCES public.factures(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transactions RLS select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Transactions RLS insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Transactions RLS update" ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Transactions RLS delete" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 8. MODULE AGRICULTURE (PARCELLES, RÉCOLTES, INTRANTS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.parcelles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  nom TEXT NOT NULL,
  superficie_ha NUMERIC(10, 2) NOT NULL DEFAULT 1,
  culture TEXT NOT NULL DEFAULT 'Maïs',
  localisation TEXT NOT NULL DEFAULT 'N''Djamena',
  statut TEXT NOT NULL DEFAULT 'En culture',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.parcelles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parcelles RLS select" ON public.parcelles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Parcelles RLS insert" ON public.parcelles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Parcelles RLS update" ON public.parcelles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Parcelles RLS delete" ON public.parcelles FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.recoltes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  parcelle_id UUID NOT NULL REFERENCES public.parcelles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantite_kg NUMERIC(14, 2) NOT NULL DEFAULT 0,
  prix_vente_fcfa NUMERIC(14, 0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recoltes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recoltes RLS select" ON public.recoltes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Recoltes RLS insert" ON public.recoltes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Recoltes RLS update" ON public.recoltes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Recoltes RLS delete" ON public.recoltes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.intrants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL CHECK (categorie IN ('Engrais', 'Semences', 'Pesticides')) DEFAULT 'Engrais',
  quantite NUMERIC(14, 2) NOT NULL DEFAULT 0,
  unite TEXT NOT NULL DEFAULT 'sac',
  seuil_alerte NUMERIC(14, 2) NOT NULL DEFAULT 5,
  cout_unitaire_fcfa NUMERIC(14, 0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.intrants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intrants RLS select" ON public.intrants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Intrants RLS insert" ON public.intrants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Intrants RLS update" ON public.intrants FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Intrants RLS delete" ON public.intrants FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 9. MODULE ÉLEVAGE (ANIMAUX, NAISSANCES, VACCINS, ALIMENTS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.animaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  numero_boucle TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('boeuf', 'vache', 'mouton', 'chevre', 'poulet', 'porc')) DEFAULT 'vache',
  sexe TEXT NOT NULL CHECK (sexe IN ('Mâle', 'Femelle')) DEFAULT 'Femelle',
  race TEXT NOT NULL DEFAULT 'Zébu Bororo',
  date_naissance DATE,
  poids_kg NUMERIC(10, 2) NOT NULL DEFAULT 0,
  photo_url TEXT,
  statut TEXT NOT NULL CHECK (statut IN ('Vivant', 'Vendu', 'Mort')) DEFAULT 'Vivant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.animaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Animaux RLS select" ON public.animaux FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Animaux RLS insert" ON public.animaux FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Animaux RLS update" ON public.animaux FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Animaux RLS delete" ON public.animaux FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.naissances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  mere_id UUID REFERENCES public.animaux(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  nombre_petits INTEGER NOT NULL DEFAULT 1,
  ajoute_au_troupeau BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.naissances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Naissances RLS select" ON public.naissances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Naissances RLS insert" ON public.naissances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Naissances RLS update" ON public.naissances FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Naissances RLS delete" ON public.naissances FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.vaccins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  animal_id UUID NOT NULL REFERENCES public.animaux(id) ON DELETE CASCADE,
  nom_vaccin TEXT NOT NULL,
  date_vaccin DATE NOT NULL DEFAULT CURRENT_DATE,
  date_rappel DATE NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('Fait', 'À faire')) DEFAULT 'Fait',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vaccins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vaccins RLS select" ON public.vaccins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vaccins RLS insert" ON public.vaccins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vaccins RLS update" ON public.vaccins FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vaccins RLS delete" ON public.vaccins FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.aliments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  nom TEXT NOT NULL,
  stock_sacs NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cout_sac_fcfa NUMERIC(14, 0) NOT NULL DEFAULT 0,
  consommation_jour NUMERIC(10, 2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.aliments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aliments RLS select" ON public.aliments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Aliments RLS insert" ON public.aliments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Aliments RLS update" ON public.aliments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Aliments RLS delete" ON public.aliments FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 10. STORAGE BUCKETS (logos, animaux)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('animaux', 'animaux', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques Storage : seul l'admin authentifié peut uploader/modifier dans son dossier
CREATE POLICY "Logos lecture publique"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Logos upload authentifie"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Logos update authentifie"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Animaux lecture publique"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'animaux');

CREATE POLICY "Animaux upload authentifie"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'animaux' AND auth.role() = 'authenticated');

CREATE POLICY "Animaux update authentifie"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'animaux' AND auth.role() = 'authenticated');

-- ============================================================================
-- 11. TRIGGER : Créer automatiquement le profil lors de l'inscription admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nom_ferme, telephone_whatsapp, adresse, ville, pays, devise)
  VALUES (
    NEW.id,
    'Ferme AgriElevage Tchad',
    '+235 66 00 00 00',
    'Quartier Chagoua, N''Djamena',
    'N''Djamena',
    'Tchad',
    'FCFA'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
