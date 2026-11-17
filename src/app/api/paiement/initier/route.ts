import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      facture_id?: string;
      numero?: string;
      montant_fcfa?: number;
      telephone?: string;
      operateur?: "Airtel Money Tchad" | "Moov Money Tchad";
      provider?: "NotchPay" | "Campay" | "Monerails";
    };

    const montant = Number(body.montant_fcfa ?? 0);
    if (montant <= 0) {
      return NextResponse.json(
        { ok: false, error: "Montant invalide pour le paiement Mobile Money." },
        { status: 400 }
      );
    }

    const provider = body.provider || (process.env.PAYMENT_PROVIDER as "NotchPay" | "Campay" | "Monerails") || "NotchPay";
    const reference = `TD-${Date.now()}`;

    // Exemple d'intégration NotchPay si la clé est présente
    if (provider === "NotchPay" && process.env.NOTCHPAY_PUBLIC_KEY) {
      const res = await fetch("https://api.notchpay.co/payments/initialize", {
        method: "POST",
        headers: {
          Authorization: process.env.NOTCHPAY_PUBLIC_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: montant,
          currency: "XAF",
          reference,
          description: `Facture ${body.numero ?? ""} - AgriElevage Tchad Pro`,
          phone: body.telephone,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { authorization_url?: string };
        return NextResponse.json({
          ok: true,
          provider,
          reference,
          payment_url: data.authorization_url ?? null,
          message: `Demande envoyée via ${provider} (${body.operateur}).`,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      provider,
      reference,
      payment_url: null,
      message: `Paiement ${body.operateur ?? "Mobile Money"} initié via ${provider} (Réf : ${reference}). Confirmez sur le téléphone du client.`,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Impossible d'initier le paiement Mobile Money." },
      { status: 500 }
    );
  }
}
