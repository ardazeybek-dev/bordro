import type {
  AylikBordro,
  HesapSecenekleri,
  IsverenMaliyeti,
  VergiDilimi,
  YilParametreleri,
  YillikSonuc,
} from "./tipler.js";
import { YIL_2026 } from "./veri/2026.js";

/** Supported years. Adding a new year is one line here. */
export const YILLAR: Record<number, YilParametreleri> = {
  2026: YIL_2026,
};

/** The most recent year that has a parameter file. */
export const VARSAYILAN_YIL = Math.max(...Object.keys(YILLAR).map(Number));

/** Rounds an amount to the kuruş. Every payroll line is rounded to 2 decimals. */
export function kurusaYuvarla(tutar: number): number {
  return Math.round((tutar + Number.EPSILON) * 100) / 100;
}

export function yilParametreleri(yil: number = VARSAYILAN_YIL): YilParametreleri {
  const p = YILLAR[yil];
  if (!p) {
    const destekli = Object.keys(YILLAR).join(", ");
    throw new Error(`${yil} yılı için parametre yok. Desteklenen yıllar: ${destekli}`);
  }
  return p;
}

/**
 * Total income tax from the schedule for a given cumulative tax base.
 *
 * Tax accumulates from the start of the year, so a single month's tax is
 * "total tax up to this month − total tax up to last month".
 */
export function tarifeyeGoreVergi(
  kumulatifMatrah: number,
  dilimler: readonly VergiDilimi[],
): number {
  let vergi = 0;
  let altSinir = 0;
  for (const dilim of dilimler) {
    if (kumulatifMatrah <= altSinir) break;
    const dilimdekiTutar = Math.min(kumulatifMatrah, dilim.ustSinir) - altSinir;
    vergi += dilimdekiTutar * dilim.oran;
    altSinir = dilim.ustSinir;
  }
  return vergi;
}

/** Returns the tax bracket the cumulative base falls into. */
export function dilimOrani(kumulatifMatrah: number, dilimler: readonly VergiDilimi[]): number {
  for (const dilim of dilimler) {
    if (kumulatifMatrah <= dilim.ustSinir) return dilim.oran;
  }
  return dilimler[dilimler.length - 1]?.oran ?? 0;
}

/** Clamps the gross salary between the social security floor and ceiling. */
export function primeEsasKazanc(brut: number, p: YilParametreleri): number {
  return Math.min(Math.max(brut, p.sgkTaban), p.sgkTavan);
}

/**
 * Calculates the twelve-month payroll.
 *
 * Income tax in Turkey accumulates across the year, so even when the gross
 * salary never changes the net pay drops in the month the higher bracket is
 * reached. This function computes every month separately to make that visible.
 */
export function yillikHesapla(brut: number, secenekler: HesapSecenekleri = {}): YillikSonuc {
  if (!Number.isFinite(brut) || brut <= 0) {
    throw new Error("Brüt maaş sıfırdan büyük bir sayı olmalı.");
  }

  const p = yilParametreleri(secenekler.yil);
  const istisnaUygula = secenekler.asgariUcretIstisnasi ?? true;

  // The minimum wage earner's own payroll: this is where the exemption comes from.
  const asgariMatrah = kurusaYuvarla(
    p.asgariUcretBrut * (1 - p.sgkIsciOrani - p.issizlikIsciOrani),
  );
  const asgariDamga = kurusaYuvarla(p.asgariUcretBrut * p.damgaVergisiOrani);

  const sgkMatrahi = kurusaYuvarla(primeEsasKazanc(brut, p));
  const sgkIsci = kurusaYuvarla(sgkMatrahi * p.sgkIsciOrani);
  const issizlikIsci = kurusaYuvarla(sgkMatrahi * p.issizlikIsciOrani);
  const gelirVergisiMatrahi = kurusaYuvarla(brut - sgkIsci - issizlikIsci);
  const hesaplananDamgaVergisi = kurusaYuvarla(brut * p.damgaVergisiOrani);

  const aylar: AylikBordro[] = [];
  const dilimGecisAylari: number[] = [];
  let kumulatif = 0;
  let asgariKumulatif = 0;
  let oncekiDilim = 0;

  for (let ay = 1; ay <= 12; ay++) {
    const oncekiKumulatif = kumulatif;
    kumulatif = kurusaYuvarla(kumulatif + gelirVergisiMatrahi);

    const hesaplananGelirVergisi = kurusaYuvarla(
      tarifeyeGoreVergi(kumulatif, p.gelirVergisiDilimleri) -
        tarifeyeGoreVergi(oncekiKumulatif, p.gelirVergisiDilimleri),
    );

    // The minimum wage earner's tax for that month is the exemption ceiling.
    const asgariOncekiKumulatif = asgariKumulatif;
    asgariKumulatif = kurusaYuvarla(asgariKumulatif + asgariMatrah);
    const asgariAylikVergi = kurusaYuvarla(
      tarifeyeGoreVergi(asgariKumulatif, p.gelirVergisiDilimleri) -
        tarifeyeGoreVergi(asgariOncekiKumulatif, p.gelirVergisiDilimleri),
    );

    const gelirVergisiIstisnasi = istisnaUygula
      ? Math.min(hesaplananGelirVergisi, asgariAylikVergi)
      : 0;
    const damgaVergisiIstisnasi = istisnaUygula
      ? Math.min(hesaplananDamgaVergisi, asgariDamga)
      : 0;

    const gelirVergisi = kurusaYuvarla(hesaplananGelirVergisi - gelirVergisiIstisnasi);
    const damgaVergisi = kurusaYuvarla(hesaplananDamgaVergisi - damgaVergisiIstisnasi);
    const kesintiler = kurusaYuvarla(sgkIsci + issizlikIsci + gelirVergisi + damgaVergisi);
    const net = kurusaYuvarla(brut - kesintiler);

    const buAyinDilimi = dilimOrani(kumulatif, p.gelirVergisiDilimleri);
    const dilimAtladi = ay > 1 && buAyinDilimi > oncekiDilim;
    if (dilimAtladi) dilimGecisAylari.push(ay);
    oncekiDilim = buAyinDilimi;

    aylar.push({
      ay,
      brut,
      sgkMatrahi,
      sgkIsci,
      issizlikIsci,
      gelirVergisiMatrahi,
      kumulatifMatrah: kumulatif,
      hesaplananGelirVergisi,
      gelirVergisiIstisnasi,
      gelirVergisi,
      hesaplananDamgaVergisi,
      damgaVergisiIstisnasi,
      damgaVergisi,
      kesintiler,
      net,
      vergiDilimiOrani: buAyinDilimi,
      dilimAtladi,
    });
  }

  const topla = (secici: (a: AylikBordro) => number) =>
    kurusaYuvarla(aylar.reduce((t, a) => t + secici(a), 0));

  const ilkAy = aylar[0]!;
  const sonAy = aylar[aylar.length - 1]!;

  return {
    yil: p.yil,
    brut,
    aylar,
    toplam: {
      brut: topla((a) => a.brut),
      sgkIsci: topla((a) => a.sgkIsci),
      issizlikIsci: topla((a) => a.issizlikIsci),
      gelirVergisi: topla((a) => a.gelirVergisi),
      damgaVergisi: topla((a) => a.damgaVergisi),
      kesintiler: topla((a) => a.kesintiler),
      net: topla((a) => a.net),
    },
    dilimGecisAylari,
    netDegisimi: kurusaYuvarla(sonAy.net - ilkAy.net),
  };
}

/**
 * Calculates the payroll for a single month.
 *
 * @param brut Monthly gross wage
 * @param ay Month of the year (1 = January). The result depends on the month because tax is cumulative.
 */
export function hesapla(brut: number, ay = 1, secenekler: HesapSecenekleri = {}): AylikBordro {
  if (!Number.isInteger(ay) || ay < 1 || ay > 12) {
    throw new Error("Ay 1 ile 12 arasında bir tam sayı olmalı.");
  }
  return yillikHesapla(brut, secenekler).aylar[ay - 1]!;
}

/** Gross to net: returns only the take-home amount. */
export function brutenNete(brut: number, ay = 1, secenekler: HesapSecenekleri = {}): number {
  return hesapla(brut, ay, secenekler).net;
}

/**
 * Converts net to gross.
 *
 * The deductions are progressive, so there is no closed-form inverse; a binary
 * search converges on the answer to the kuruş.
 */
export function nettenBrute(net: number, ay = 1, secenekler: HesapSecenekleri = {}): number {
  if (!Number.isFinite(net) || net <= 0) {
    throw new Error("Net maaş sıfırdan büyük bir sayı olmalı.");
  }

  let alt = 0;
  let ust = Math.max(net * 3, 1000);
  while (brutenNete(ust, ay, secenekler) < net) {
    ust *= 2;
    if (ust > 1e12) throw new Error("Net maaş çok yüksek, brüt karşılığı bulunamadı.");
  }

  // 60 steps is far more than enough to narrow a 1e12 range below one kuruş.
  for (let i = 0; i < 60; i++) {
    const orta = (alt + ust) / 2;
    if (brutenNete(orta, ay, secenekler) < net) alt = orta;
    else ust = orta;
  }

  // Rounding to the kuruş can land one kuruş under the target; step up if it does.
  const brut = kurusaYuvarla(ust);
  return brutenNete(brut, ay, secenekler) < net ? kurusaYuvarla(brut + 0.01) : brut;
}

/** Monthly employer cost: gross plus the employer premiums. */
export function isvereneMaliyet(
  brut: number,
  secenekler: HesapSecenekleri = {},
): IsverenMaliyeti {
  if (!Number.isFinite(brut) || brut <= 0) {
    throw new Error("Brüt maaş sıfırdan büyük bir sayı olmalı.");
  }

  const p = yilParametreleri(secenekler.yil);
  const indirimUygulandi = secenekler.besPuanIndirimi ?? false;
  const sgkMatrahi = kurusaYuvarla(primeEsasKazanc(brut, p));
  const isverenOrani = indirimUygulandi ? p.sgkIsverenIndirimliOrani : p.sgkIsverenOrani;

  const sgkIsveren = kurusaYuvarla(sgkMatrahi * isverenOrani);
  const issizlikIsveren = kurusaYuvarla(sgkMatrahi * p.issizlikIsverenOrani);

  return {
    brut,
    sgkMatrahi,
    sgkIsveren,
    issizlikIsveren,
    toplamMaliyet: kurusaYuvarla(brut + sgkIsveren + issizlikIsveren),
    indirimUygulandi,
  };
}
