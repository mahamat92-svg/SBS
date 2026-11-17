export function formatFCFA(montant: number | string | null | undefined): string {
  const n = Number(montant ?? 0);
  if (Number.isNaN(n)) return "0 FCFA";
  return `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
}

export function formatDateFR(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTimeFR(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function cleanWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.length === 8) return `235${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const clean = cleanWhatsAppPhone(phone);
  if (!clean) return "https://wa.me/";
  if (!message) return `https://wa.me/${clean}`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function joursAvant(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
