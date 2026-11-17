export type CategorieProduit = "agriculture" | "elevage";
export type UniteProduit = "kg" | "sac" | "tete";
export type TypeClient = "Acheteur" | "Fournisseur";
export type StatutFacture = "Brouillon" | "Envoyee" | "Payee" | "Impayee";
export type ModePaiement =
  | "Airtel Money Tchad"
  | "Moov Money Tchad"
  | "Espèces"
  | "Virement bancaire";

export type TypeCompte = "Banque" | "Mobile Money" | "Caisse";
export type StatutConnexion = "Connecte" | "Non connecte" | "Manuel";
export type TypeTransaction = "Entree" | "Sortie";
export type CategorieIntrant = "Engrais" | "Semences" | "Pesticides";
export type TypeAnimal = "boeuf" | "vache" | "mouton" | "chevre" | "poulet" | "porc";
export type StatutAnimal = "Vivant" | "Vendu" | "Mort";
export type StatutVaccin = "Fait" | "À faire";

export interface Profile {
  id: string;
  nom_ferme: string;
  logo_url: string | null;
  telephone_whatsapp: string;
  adresse: string;
  ville: string;
  pays: string;
  devise: string;
}

export interface Client {
  id: string;
  nom: string;
  telephone_whatsapp: string;
  ville: string;
  type: TypeClient;
}

export interface Produit {
  id: string;
  nom: string;
  categorie: CategorieProduit;
  prix_fcfa: number;
  stock: number;
  unite: UniteProduit;
  seuil_alerte: number;
}

export interface CompteBancaire {
  id: string;
  type: TypeCompte;
  nom_banque: string;
  nom_compte: string;
  numero_masque: string;
  solde_fcfa: number;
  derniere_synchro: string;
  statut_connexion: StatutConnexion;
  provider: string;
  api_url?: string | null;
  vault_secret_id?: string | null;
}

export interface ReleveBancaire {
  id: string;
  compte_id: string;
  date: string;
  libelle: string;
  montant_fcfa: number;
  solde_apres: number;
}

export interface FactureLigne {
  id: string;
  facture_id: string;
  produit_id: string | null;
  designation: string;
  quantite: number;
  prix_fcfa: number;
  total_ligne: number;
}

export interface Facture {
  id: string;
  numero: string;
  client_id: string | null;
  date: string;
  sous_total: number;
  remise: number;
  total_fcfa: number;
  statut: StatutFacture;
  mode_paiement: ModePaiement;
  compte_id: string | null;
  lignes?: FactureLigne[];
}

export interface Transaction {
  id: string;
  compte_id: string | null;
  type: TypeTransaction;
  montant_fcfa: number;
  motif: string;
  date: string;
  facture_id: string | null;
}

export interface Parcelle {
  id: string;
  nom: string;
  superficie_ha: number;
  culture: string;
  localisation: string;
  statut: string;
}

export interface Recolte {
  id: string;
  parcelle_id: string;
  date: string;
  quantite_kg: number;
  prix_vente_fcfa: number;
}

export interface Intrant {
  id: string;
  nom: string;
  categorie: CategorieIntrant;
  quantite: number;
  unite: string;
  seuil_alerte: number;
  cout_unitaire_fcfa: number;
}

export interface Animal {
  id: string;
  numero_boucle: string;
  type: TypeAnimal;
  sexe: "Mâle" | "Femelle";
  race: string;
  date_naissance: string | null;
  poids_kg: number;
  photo_url: string | null;
  statut: StatutAnimal;
}

export interface Naissance {
  id: string;
  mere_id: string | null;
  date: string;
  nombre_petits: number;
  ajoute_au_troupeau: boolean;
}

export interface Vaccin {
  id: string;
  animal_id: string;
  nom_vaccin: string;
  date_vaccin: string;
  date_rappel: string;
  statut: StatutVaccin;
}

export interface Aliment {
  id: string;
  nom: string;
  stock_sacs: number;
  cout_sac_fcfa: number;
  consommation_jour: number;
}

export const BANQUES_TCHAD = [
  "Ecobank Tchad",
  "UBA Tchad",
  "Banque Commerciale du Chari (BCC)",
  "BSIC Tchad",
  "Orabank Tchad",
  "Autre banque",
] as const;

export const MOBILE_MONEY_TCHAD = [
  "Airtel Money Tchad",
  "Moov Money Tchad",
  "Espèces",
  "Virement bancaire",
] as const;

export const CULTURES_TCHAD = [
  "Maïs",
  "Mil",
  "Sorgho",
  "Arachide",
  "Coton",
  "Manioc",
  "Riz",
] as const;
