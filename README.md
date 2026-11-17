# AgriElevage Tchad Pro

SaaS PRO Mono-Client **Agriculture + Élevage** conçu pour le **Tchad** (N'Djamena, FCFA / XAF).

## Fonctionnalités principales

- **Auth Mono-Client Supabase** : Un seul compte administrateur protégé par Supabase Auth + Row Level Security (RLS) sur toutes les tables.
- **Dashboard Financier & Opérationnel** : Ventes du mois, Dépenses, Bénéfice, Factures impayées, Solde bancaire consolidé, Graphique Entrées vs Sorties, 5 dernières factures et Alertes (vaccins dans 3 jours, stocks bas, impayés).
- **Module Mes Comptes Bancaires (Tchad)** :
  - Banques supportées : Ecobank Tchad, UBA Tchad, Banque Commerciale du Chari (BCC), BSIC Tchad, Orabank Tchad, Airtel Money Tchad, Moov Money Tchad, Caisse.
  - **Option A** : Connexion sécurisée via agrégateur (Mono / Okra / Plaid / Bridge) sans jamais stocker le mot de passe bancaire.
  - **Option B** : Connexion par clé API banque + test de connexion serveur.
  - **Option C** : Connexion manuelle avec mise à jour automatique à chaque facture payée ou dépense.
  - Import de relevés bancaires **Excel / CSV** et ajout de transactions manuelles.
- **Module Agriculture** : Parcelles (Maïs, Mil, Sorgho, Arachide, Coton, Manioc, Riz), Récoltes avec calcul automatique, Stock d'intrants (Engrais, Semences, Pesticides) avec alerte de stock bas.
- **Module Élevage** : Troupeau avec photo (Supabase Storage), Naissances avec ajout automatique au troupeau, Vaccins avec alerte J-3, Alimentation avec calcul du coût journalier.
- **Module Facturation PRO + Excel** :
  - Export **Excel (.xlsx)** avec logo de la ferme et **formules Excel natives** (`=C*D`, `=SUM(...)`).
  - Export **PDF** propre avec logo et coordonnées N'Djamena, Tchad.
  - Envoi **WhatsApp** direct (`wa.me`) pré-rempli en français.
  - Vue **Impression** épurée.
  - Paiement Mobile Money (Airtel Money Tchad / Moov Money Tchad) via NotchPay / Campay / Monerails.
- **Clients & Produits** : Gestion complète, appel WhatsApp direct, import/export Excel des produits.
- **Paramètres / Mon Entreprise** : Upload du logo vers Supabase Storage (`logos`), utilisé automatiquement partout.

---

## Étapes pour créer le projet Supabase et brancher les clés

### 1. Créer le projet Supabase
1. Rendez-vous sur [https://supabase.com](https://supabase.com) et connectez-vous.
2. Cliquez sur **New Project**.
3. Choisissez un nom (ex: `agrielevage-tchad-pro`), un mot de passe de base de données solide et la région la plus proche (ex: `eu-west-1` ou `eu-central-1`).
4. Attendez environ 2 minutes que la base de données soit prête.

### 2. Créer les tables, le RLS et les buckets Storage
1. Dans le menu de gauche de Supabase, ouvrez **SQL Editor**.
2. Cliquez sur **New query**.
3. Copiez tout le contenu du fichier `supabase/schema.sql` de ce projet et collez-le dans l'éditeur.
4. Cliquez sur **Run** (Exécuter).
   - Toutes les tables (`profiles`, `clients`, `produits`, `factures`, `facture_lignes`, `parcelles`, `recoltes`, `intrants`, `animaux`, `naissances`, `vaccins`, `aliments`, `transactions`, `comptes_bancaires`, `releves_bancaires`) sont créées avec **RLS activé**.
   - Les buckets Storage `logos` et `animaux` sont créés automatiquement.

### 3. Créer le compte Admin unique
1. Dans Supabase, allez dans **Authentication > Users**.
2. Cliquez sur **Add user > Create new user**.
3. Saisissez l'email et le mot de passe de votre client administrateur au Tchad, puis validez (**Auto Confirm User** coché).
4. (Optionnel) Dans **Authentication > Sign In / Providers**, désactivez *Allow new users to sign up* pour verrouiller l'application en mode mono-client strict.

### 4. Récupérer et brancher les clés dans `.env.local`
1. Dans Supabase, allez dans **Project Settings > API**.
2. Copiez le fichier `.env.example` vers `.env.local` :
   ```bash
   cp .env.example .env.local
   ```
3. Remplissez dans `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL` : votre *Project URL* (`https://ton-projet.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` : votre clé publique (`sb_publishable_...` ou *anon public*)
   - `SUPABASE_SERVICE_ROLE_KEY` : votre clé secrète (`sb_secret_...` ou *service_role*, à garder secrète côté serveur uniquement)

### 5. Lancer l'application en local
```bash
npm install
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

> **Astuce** : Tant que `.env.local` n'est pas configuré, l'application démarre en **Mode Aperçu Local** avec des données de démonstration tchadiennes stockées dans votre navigateur, afin que vous puissiez tester chaque écran immédiatement.
