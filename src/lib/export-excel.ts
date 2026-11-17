"use client";

import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import type { Client, Facture, Produit, Profile } from "@/types/database";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function fetchImageBase64(url: string): Promise<{ base64: string; ext: "png" | "jpeg" } | null> {
  try {
    if (url.startsWith("data:image/")) {
      const ext = url.includes("image/png") ? "png" : "jpeg";
      const base64 = url.split(",")[1];
      return { base64, ext };
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const contentType = res.headers.get("content-type") || "";
    const ext = contentType.includes("png") ? "png" : "jpeg";
    return { base64, ext };
  } catch {
    return null;
  }
}

export async function exportFactureExcel(
  facture: Facture,
  client: Client | undefined,
  profile: Profile
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = profile.nom_ferme;
  const ws = wb.addWorksheet("Facture");

  ws.columns = [
    { width: 38 }, // A: Désignation
    { width: 14 }, // B: Unité / Réf
    { width: 14 }, // C: Quantité
    { width: 18 }, // D: Prix Unitaire (FCFA)
    { width: 22 }, // E: Total Ligne (FCFA)
  ];

  // Logo si présent
  if (profile.logo_url) {
    const img = await fetchImageBase64(profile.logo_url);
    if (img) {
      const imageId = wb.addImage({
        base64: img.base64,
        extension: img.ext,
      });
      ws.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: 90, height: 65 },
      });
    }
  }

  // En-tête Entreprise
  ws.getCell("B1").value = profile.nom_ferme;
  ws.getCell("B1").font = { bold: true, size: 16, color: { argb: "FF166534" } };
  ws.getCell("B2").value = `${profile.adresse}, ${profile.ville}, ${profile.pays}`;
  ws.getCell("B3").value = `WhatsApp : ${profile.telephone_whatsapp}`;

  // Infos Facture
  ws.getCell("D1").value = `FACTURE N° ${facture.numero}`;
  ws.getCell("D1").font = { bold: true, size: 13, color: { argb: "FF78350F" } };
  ws.getCell("D2").value = `Date : ${facture.date}`;
  ws.getCell("D3").value = `Statut : ${facture.statut}`;

  // Client
  ws.getCell("A6").value = "Facturé à :";
  ws.getCell("A6").font = { bold: true };
  ws.getCell("B6").value = client ? `${client.nom} (${client.ville})` : "Client comptoir";
  ws.getCell("B7").value = client?.telephone_whatsapp ? `Tél : ${client.telephone_whatsapp}` : "";
  ws.getCell("D6").value = `Mode de paiement : ${facture.mode_paiement}`;

  // En-tête tableau (ligne 9)
  const headerRow = ws.getRow(9);
  headerRow.values = [
    "Désignation / Produit",
    "Devise",
    "Quantité",
    "Prix Unitaire (FCFA)",
    "Total Ligne (FCFA)",
  ];
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF166534" },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });

  const lignes = facture.lignes ?? [];
  const startRow = 10;
  lignes.forEach((ligne, idx) => {
    const r = startRow + idx;
    const row = ws.getRow(r);
    row.getCell(1).value = ligne.designation;
    row.getCell(2).value = "FCFA";
    row.getCell(3).value = Number(ligne.quantite);
    row.getCell(4).value = Number(ligne.prix_fcfa);
    // Formule Excel native : Quantité * Prix
    row.getCell(5).value = {
      formula: `C${r}*D${r}`,
      result: Number(ligne.quantite) * Number(ligne.prix_fcfa),
    };
    row.getCell(4).numFmt = "#,##0";
    row.getCell(5).numFmt = "#,##0";
  });

  const endRow = Math.max(startRow, startRow + lignes.length - 1);
  const subRow = endRow + 2;
  const remRow = subRow + 1;
  const totRow = remRow + 1;

  ws.getCell(`D${subRow}`).value = "Sous-total (FCFA)";
  ws.getCell(`D${subRow}`).font = { bold: true };
  ws.getCell(`E${subRow}`).value = {
    formula: lignes.length > 0 ? `SUM(E${startRow}:E${endRow})` : "0",
    result: Number(facture.sous_total),
  };
  ws.getCell(`E${subRow}`).numFmt = "#,##0";

  ws.getCell(`D${remRow}`).value = "Remise (FCFA)";
  ws.getCell(`E${remRow}`).value = Number(facture.remise);
  ws.getCell(`E${remRow}`).numFmt = "#,##0";

  ws.getCell(`D${totRow}`).value = "TOTAL À PAYER (FCFA)";
  ws.getCell(`D${totRow}`).font = { bold: true, size: 12, color: { argb: "FF166534" } };
  ws.getCell(`E${totRow}`).value = {
    formula: `E${subRow}-E${remRow}`,
    result: Number(facture.total_fcfa),
  };
  ws.getCell(`E${totRow}`).font = { bold: true, size: 12, color: { argb: "FF166534" } };
  ws.getCell(`E${totRow}`).numFmt = '#,##0 "FCFA"';

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${facture.numero}.xlsx`);
}

export async function exportAllFacturesExcel(
  factures: Facture[],
  clients: Client[],
  profile: Profile
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Factures");
  ws.columns = [
    { header: "N° Facture", key: "numero", width: 18 },
    { header: "Date", key: "date", width: 14 },
    { header: "Client", key: "client", width: 28 },
    { header: "Mode paiement", key: "mode", width: 22 },
    { header: "Statut", key: "statut", width: 14 },
    { header: "Total (FCFA)", key: "total", width: 20 },
  ];

  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF166534" } };
  });

  factures.forEach((f) => {
    const cli = clients.find((c) => c.id === f.client_id);
    const row = ws.addRow({
      numero: f.numero,
      date: f.date,
      client: cli?.nom ?? "Client comptoir",
      mode: f.mode_paiement,
      statut: f.statut,
      total: Number(f.total_fcfa),
    });
    row.getCell(6).numFmt = "#,##0";
  });

  if (factures.length > 0) {
    const lastRow = factures.length + 1;
    const sumRow = ws.addRow({
      numero: "TOTAL GÉNÉRAL",
      total: {
        formula: `SUM(F2:F${lastRow})`,
        result: factures.reduce((acc, f) => acc + Number(f.total_fcfa), 0),
      } as unknown as number,
    });
    sumRow.font = { bold: true };
    sumRow.getCell(6).numFmt = '#,##0 "FCFA"';
  }

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `factures-${profile.nom_ferme.toLowerCase().replace(/\s+/g, "-")}.xlsx`
  );
}

export async function exportProduitsExcel(produits: Produit[]): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Produits");
  ws.columns = [
    { header: "Nom", key: "nom", width: 32 },
    { header: "Categorie", key: "categorie", width: 16 },
    { header: "Prix_FCFA", key: "prix_fcfa", width: 16 },
    { header: "Stock", key: "stock", width: 12 },
    { header: "Unite", key: "unite", width: 12 },
  ];

  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF78350F" } };
  });

  produits.forEach((p) => {
    ws.addRow({
      nom: p.nom,
      categorie: p.categorie,
      prix_fcfa: Number(p.prix_fcfa),
      stock: Number(p.stock),
      unite: p.unite,
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "produits-agrielevage-tchad.xlsx"
  );
}

export async function parseProduitsExcel(
  file: File
): Promise<Omit<Produit, "id">[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return rows
    .map((r) => {
      const nom = String(r.Nom ?? r.nom ?? "").trim();
      if (!nom) return null;
      const catRaw = String(r.Categorie ?? r.categorie ?? "agriculture").toLowerCase();
      const categorie = catRaw.includes("elev") ? "elevage" : "agriculture";
      const uniteRaw = String(r.Unite ?? r.unite ?? "sac").toLowerCase();
      const unite = uniteRaw === "kg" ? "kg" : uniteRaw === "tete" || uniteRaw === "tête" ? "tete" : "sac";
      return {
        nom,
        categorie,
        prix_fcfa: Number(r.Prix_FCFA ?? r.prix_fcfa ?? r.Prix ?? 0) || 0,
        stock: Number(r.Stock ?? r.stock ?? 0) || 0,
        unite,
        seuil_alerte: 5,
      } satisfies Omit<Produit, "id">;
    })
    .filter((x): x is Omit<Produit, "id"> => x !== null);
}

export async function parseReleveFile(
  file: File
): Promise<{ date: string; libelle: string; montant_fcfa: number }[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return rows
    .map((r) => {
      const dateRaw = r.Date ?? r.date ?? new Date().toISOString().slice(0, 10);
      const libelle = String(r.Libelle ?? r.Libellé ?? r.libelle ?? r.Motif ?? "Opération bancaire").trim();
      const montantRaw = r.Montant ?? r.montant ?? r.Montant_FCFA ?? r.montant_fcfa ?? 0;
      const montant = Number(String(montantRaw).replace(/\s/g, "").replace(",", "."));
      if (Number.isNaN(montant) || !libelle) return null;
      return {
        date: String(dateRaw).slice(0, 10),
        libelle,
        montant_fcfa: Math.round(montant),
      };
    })
    .filter((x): x is { date: string; libelle: string; montant_fcfa: number } => x !== null);
}
