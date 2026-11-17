import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: "Mono" | "Okra" | "Plaid" | "Bridge";
      nom_banque?: string;
      code_session?: string;
    };

    const provider = body.provider || "Mono";
    const nomBanque = body.nom_banque || "Ecobank Tchad";

    // En production, on échange `code_session` contre un `account_id` via l'API Mono/Okra/Plaid/Bridge
    // en utilisant MONO_SECRET_KEY / OKRA_SECRET_KEY / BRIDGE_CLIENT_SECRET côté serveur.
    // Aucun mot de passe bancaire ne transite jamais par notre SaaS.
    const maskedDigits = String(Math.floor(1000 + Math.random() * 9000));

    return NextResponse.json({
      ok: true,
      provider,
      nom_banque: nomBanque,
      numero_masque: maskedDigits,
      solde_fcfa: 2850000,
      statut_connexion: "Connecte",
      vault_secret_id: `vault_${provider.toLowerCase()}_${Date.now()}`,
      derniere_synchro: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la synchronisation avec l'agrégateur." },
      { status: 500 }
    );
  }
}
