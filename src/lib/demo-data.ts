import type {
  Aliment,
  Animal,
  Client,
  CompteBancaire,
  Facture,
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

export interface DemoStoreState {
  profile: Profile;
  clients: Client[];
  produits: Produit[];
  comptes_bancaires: CompteBancaire[];
  releves_bancaires: ReleveBancaire[];
  factures: Facture[];
  transactions: Transaction[];
  parcelles: Parcelle[];
  recoltes: Recolte[];
  intrants: Intrant[];
  animaux: Animal[];
  naissances: Naissance[];
  vaccins: Vaccin[];
  aliments: Aliment[];
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createInitialDemoState(): DemoStoreState {
  const c1 = "cpt-ecobank";
  const c2 = "cpt-airtel";
  const c3 = "cpt-moov";
  const c4 = "cpt-caisse";

  const cl1 = "cli-1";
  const cl2 = "cli-2";
  const cl3 = "cli-3";

  const p1 = "prod-1";
  const p2 = "prod-2";
  const p3 = "prod-3";
  const p4 = "prod-4";

  const parc1 = "parc-1";
  const parc2 = "parc-2";

  const a1 = "ani-1";
  const a2 = "ani-2";
  const a3 = "ani-3";
  const a4 = "ani-4";

  return {
    profile: {
      id: "demo-admin",
      nom_ferme: "Ferme Al-Baraka N'Djamena",
      logo_url: null,
      telephone_whatsapp: "+235 66 24 18 90",
      adresse: "Quartier Chagoua, Rue 40m",
      ville: "N'Djamena",
      pays: "Tchad",
      devise: "FCFA",
    },
    clients: [
      {
        id: cl1,
        nom: "Établissements Mahamat & Fils",
        telephone_whatsapp: "+235 66 45 12 30",
        ville: "N'Djamena",
        type: "Acheteur",
      },
      {
        id: cl2,
        nom: "Boucherie Moderne du Chari",
        telephone_whatsapp: "+235 99 18 74 22",
        ville: "N'Djamena",
        type: "Acheteur",
      },
      {
        id: cl3,
        nom: "Agro-Intrants Sahel SARL",
        telephone_whatsapp: "+235 62 33 10 05",
        ville: "Moundou",
        type: "Fournisseur",
      },
    ],
    produits: [
      {
        id: p1,
        nom: "Maïs jaune sec (sac 100 kg)",
        categorie: "agriculture",
        prix_fcfa: 18500,
        stock: 42,
        unite: "sac",
        seuil_alerte: 10,
      },
      {
        id: p2,
        nom: "Mil pénicillaire (sac 100 kg)",
        categorie: "agriculture",
        prix_fcfa: 22000,
        stock: 4,
        unite: "sac",
        seuil_alerte: 8,
      },
      {
        id: p3,
        nom: "Taureau Zébu engraissé",
        categorie: "elevage",
        prix_fcfa: 485000,
        stock: 6,
        unite: "tete",
        seuil_alerte: 2,
      },
      {
        id: p4,
        nom: "Mouton du Sahel",
        categorie: "elevage",
        prix_fcfa: 85000,
        stock: 15,
        unite: "tete",
        seuil_alerte: 4,
      },
    ],
    comptes_bancaires: [
      {
        id: c1,
        type: "Banque",
        nom_banque: "Ecobank Tchad",
        nom_compte: "Compte Courant Ferme",
        numero_masque: "4821",
        solde_fcfa: 3450000,
        derniere_synchro: new Date().toISOString(),
        statut_connexion: "Connecte",
        provider: "Mono",
      },
      {
        id: c2,
        type: "Mobile Money",
        nom_banque: "Airtel Money Tchad",
        nom_compte: "Airtel Marchand Ferme",
        numero_masque: "1890",
        solde_fcfa: 685000,
        derniere_synchro: new Date().toISOString(),
        statut_connexion: "Manuel",
        provider: "NotchPay",
      },
      {
        id: c3,
        type: "Mobile Money",
        nom_banque: "Moov Money Tchad",
        nom_compte: "Moov Money Principal",
        numero_masque: "7422",
        solde_fcfa: 290000,
        derniere_synchro: new Date().toISOString(),
        statut_connexion: "Manuel",
        provider: "Campay",
      },
      {
        id: c4,
        type: "Caisse",
        nom_banque: "Caisse Ferme",
        nom_compte: "Caisse Espèces N'Djamena",
        numero_masque: "0001",
        solde_fcfa: 175000,
        derniere_synchro: new Date().toISOString(),
        statut_connexion: "Manuel",
        provider: "Manuel",
      },
    ],
    releves_bancaires: [
      {
        id: "rel-1",
        compte_id: c1,
        date: addDaysISO(-4),
        libelle: "Virement Établissements Mahamat",
        montant_fcfa: 555000,
        solde_apres: 3450000,
      },
      {
        id: "rel-2",
        compte_id: c1,
        date: addDaysISO(-8),
        libelle: "Achat engrais NPK Agro-Intrants",
        montant_fcfa: -240000,
        solde_apres: 2895000,
      },
    ],
    factures: [
      {
        id: "fac-1",
        numero: "FAC-2026-001",
        client_id: cl1,
        date: addDaysISO(-4),
        sous_total: 555000,
        remise: 0,
        total_fcfa: 555000,
        statut: "Payee",
        mode_paiement: "Virement bancaire",
        compte_id: c1,
        lignes: [
          {
            id: "fl-1",
            facture_id: "fac-1",
            produit_id: p1,
            designation: "Maïs jaune sec (sac 100 kg)",
            quantite: 30,
            prix_fcfa: 18500,
            total_ligne: 555000,
          },
        ],
      },
      {
        id: "fac-2",
        numero: "FAC-2026-002",
        client_id: cl2,
        date: addDaysISO(-2),
        sous_total: 970000,
        remise: 20000,
        total_fcfa: 950000,
        statut: "Impayee",
        mode_paiement: "Airtel Money Tchad",
        compte_id: c2,
        lignes: [
          {
            id: "fl-2",
            facture_id: "fac-2",
            produit_id: p3,
            designation: "Taureau Zébu engraissé",
            quantite: 2,
            prix_fcfa: 485000,
            total_ligne: 970000,
          },
        ],
      },
      {
        id: "fac-3",
        numero: "FAC-2026-003",
        client_id: cl1,
        date: addDaysISO(-1),
        sous_total: 425000,
        remise: 0,
        total_fcfa: 425000,
        statut: "Payee",
        mode_paiement: "Moov Money Tchad",
        compte_id: c3,
        lignes: [
          {
            id: "fl-3",
            facture_id: "fac-3",
            produit_id: p4,
            designation: "Mouton du Sahel",
            quantite: 5,
            prix_fcfa: 85000,
            total_ligne: 425000,
          },
        ],
      },
    ],
    transactions: [
      {
        id: "tx-1",
        compte_id: c1,
        type: "Entree",
        montant_fcfa: 555000,
        motif: "Règlement facture FAC-2026-001",
        date: addDaysISO(-4),
        facture_id: "fac-1",
      },
      {
        id: "tx-2",
        compte_id: c3,
        type: "Entree",
        montant_fcfa: 425000,
        motif: "Règlement facture FAC-2026-003",
        date: addDaysISO(-1),
        facture_id: "fac-3",
      },
      {
        id: "tx-3",
        compte_id: c1,
        type: "Sortie",
        montant_fcfa: 240000,
        motif: "Achat engrais NPK & Semences",
        date: addDaysISO(-8),
        facture_id: null,
      },
      {
        id: "tx-4",
        compte_id: c4,
        type: "Sortie",
        montant_fcfa: 95000,
        motif: "Tourteau de coton & vaccins troupeau",
        date: addDaysISO(-3),
        facture_id: null,
      },
    ],
    parcelles: [
      {
        id: parc1,
        nom: "Parcelle Nord Chari",
        superficie_ha: 6.5,
        culture: "Maïs",
        localisation: "Koundoul, N'Djamena",
        statut: "En culture",
      },
      {
        id: parc2,
        nom: "Parcelle Est Mandelia",
        superficie_ha: 4.0,
        culture: "Sorgho",
        localisation: "Mandelia",
        statut: "Récoltée",
      },
    ],
    recoltes: [
      {
        id: "rec-1",
        parcelle_id: parc2,
        date: addDaysISO(-10),
        quantite_kg: 4800,
        prix_vente_fcfa: 185,
      },
    ],
    intrants: [
      {
        id: "int-1",
        nom: "Engrais NPK 15-15-15",
        categorie: "Engrais",
        quantite: 3,
        unite: "sac 50kg",
        seuil_alerte: 5,
        cout_unitaire_fcfa: 24000,
      },
      {
        id: "int-2",
        nom: "Semences Maïs amélioré",
        categorie: "Semences",
        quantite: 18,
        unite: "kg",
        seuil_alerte: 10,
        cout_unitaire_fcfa: 1800,
      },
      {
        id: "int-3",
        nom: "Herbicide Total",
        categorie: "Pesticides",
        quantite: 6,
        unite: "litre",
        seuil_alerte: 4,
        cout_unitaire_fcfa: 5500,
      },
    ],
    animaux: [
      {
        id: a1,
        numero_boucle: "TD-001",
        type: "vache",
        sexe: "Femelle",
        race: "Zébu Bororo",
        date_naissance: "2022-04-12",
        poids_kg: 310,
        photo_url: null,
        statut: "Vivant",
      },
      {
        id: a2,
        numero_boucle: "TD-002",
        type: "boeuf",
        sexe: "Mâle",
        race: "Zébu Arabe",
        date_naissance: "2023-01-20",
        poids_kg: 380,
        photo_url: null,
        statut: "Vivant",
      },
      {
        id: a3,
        numero_boucle: "TD-003",
        type: "mouton",
        sexe: "Mâle",
        race: "Oudah",
        date_naissance: "2024-06-15",
        poids_kg: 48,
        photo_url: null,
        statut: "Vivant",
      },
      {
        id: a4,
        numero_boucle: "TD-004",
        type: "chevre",
        sexe: "Femelle",
        race: "Chèvre du Sahel",
        date_naissance: "2024-02-10",
        poids_kg: 34,
        photo_url: null,
        statut: "Vivant",
      },
    ],
    naissances: [
      {
        id: "nais-1",
        mere_id: a1,
        date: addDaysISO(-6),
        nombre_petits: 1,
        ajoute_au_troupeau: false,
      },
    ],
    vaccins: [
      {
        id: "vac-1",
        animal_id: a1,
        nom_vaccin: "Péripneumonie (PPCB)",
        date_vaccin: addDaysISO(-178),
        date_rappel: addDaysISO(2),
        statut: "À faire",
      },
      {
        id: "vac-2",
        animal_id: a3,
        nom_vaccin: "Peste des petits ruminants (PPR)",
        date_vaccin: addDaysISO(-30),
        date_rappel: addDaysISO(150),
        statut: "Fait",
      },
    ],
    aliments: [
      {
        id: "ali-1",
        nom: "Tourteau de coton (sac 50 kg)",
        stock_sacs: 24,
        cout_sac_fcfa: 13500,
        consommation_jour: 2,
      },
      {
        id: "ali-2",
        nom: "Son de maïs & minéraux",
        stock_sacs: 14,
        cout_sac_fcfa: 9000,
        consommation_jour: 1.5,
      },
    ],
  };
}
