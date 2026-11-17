"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Client, Facture, Profile } from "@/types/database";
import { formatDateFR, formatFCFA } from "@/lib/format";

async function loadLogoDataUrl(url: string): Promise<string | null> {
  try {
    if (url.startsWith("data:image/")) return url;
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportFacturePDF(
  facture: Facture,
  client: Client | undefined,
  profile: Profile
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let startY = 18;
  if (profile.logo_url) {
    const dataUrl = await loadLogoDataUrl(profile.logo_url);
    if (dataUrl) {
      try {
        const format = dataUrl.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(dataUrl, format, 14, 12, 24, 24);
      } catch {
        // Ignorer si format image non supporté
      }
    }
  }

  const textX = profile.logo_url ? 44 : 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(22, 101, 52); // Vert forêt
  doc.text(profile.nom_ferme, textX, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`${profile.adresse}`, textX, 24);
  doc.text(`${profile.ville}, ${profile.pays}`, textX, 29);
  doc.text(`WhatsApp : ${profile.telephone_whatsapp}`, textX, 34);

  // Bloc Facture à droite
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(120, 53, 15); // Marron terre
  doc.text(`FACTURE ${facture.numero}`, 196, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Date : ${formatDateFR(facture.date)}`, 196, 25, { align: "right" });
  doc.text(`Statut : ${facture.statut}`, 196, 31, { align: "right" });

  // Client
  startY = 48;
  doc.setDrawColor(220, 220, 215);
  doc.line(14, 42, 196, 42);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("Facturé à :", 14, startY);
  doc.setFont("helvetica", "normal");
  doc.text(client ? client.nom : "Client comptoir", 14, startY + 6);
  if (client?.telephone_whatsapp) {
    doc.text(`Tél : ${client.telephone_whatsapp}`, 14, startY + 11);
  }
  if (client?.ville) {
    doc.text(`Ville : ${client.ville}`, 14, startY + 16);
  }

  doc.setFont("helvetica", "bold");
  doc.text("Mode de paiement :", 130, startY);
  doc.setFont("helvetica", "normal");
  doc.text(facture.mode_paiement, 130, startY + 6);

  // Tableau des lignes
  const rows = (facture.lignes ?? []).map((l) => [
    l.designation,
    String(l.quantite),
    formatFCFA(l.prix_fcfa),
    formatFCFA(l.total_ligne),
  ]);

  autoTable(doc, {
    startY: startY + 24,
    head: [["Désignation", "Qté", "Prix unitaire", "Total"]],
    body: rows.length > 0 ? rows : [["Prestation / Produit", "1", formatFCFA(facture.total_fcfa), formatFCFA(facture.total_fcfa)]],
    headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      1: { halign: "right", cellWidth: 22 },
      2: { halign: "right", cellWidth: 40 },
      3: { halign: "right", cellWidth: 42 },
    },
  });

  const finalY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120) + 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Sous-total : ${formatFCFA(facture.sous_total)}`, 196, finalY, { align: "right" });
  doc.text(`Remise : ${formatFCFA(facture.remise)}`, 196, finalY + 6, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(22, 101, 52);
  doc.text(`TOTAL : ${formatFCFA(facture.total_fcfa)}`, 196, finalY + 15, { align: "right" });

  // Signature
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text("Cachet et signature de la ferme", 14, finalY + 30);
  doc.line(14, finalY + 46, 75, finalY + 46);

  doc.save(`${facture.numero}.pdf`);
}
