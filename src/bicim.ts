/** Number and text formatting helpers, shared by the CLI and the web page. */

const TL_BICIMI = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const AY_ADLARI = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

/** 57339.5 → "57.339,50" */
export function tl(tutar: number): string {
  return TL_BICIMI.format(tutar);
}

/** 57339.5 → "57.339,50 ₺" */
export function tlSimgeli(tutar: number): string {
  return `${tl(tutar)} ₺`;
}

/** 0.15 → "%15" */
export function yuzde(oran: number): string {
  return `%${(oran * 100).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

/** Parses user input such as "75.000,50" / "75000" / "75 000" into a number. */
export function sayiyaCevir(girdi: string): number {
  const temiz = girdi.trim().replace(/[\s₺]/g, "").replace(/\./g, "").replace(",", ".");
  const sayi = Number(temiz);
  if (!Number.isFinite(sayi)) throw new Error(`Sayıya çevrilemedi: "${girdi}"`);
  return sayi;
}
