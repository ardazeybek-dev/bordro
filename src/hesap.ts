import type {
  AylikBordro,
  HesapSecenekleri,
  IsverenMaliyeti,
  VergiDilimi,
  YilParametreleri,
  YillikSonuc,
} from "./tipler.js";
import { YIL_2026 } from "./veri/2026.js";

/** Desteklenen yıllar. Yeni yıl eklemek için buraya bir satır eklemek yeterli. */
export const YILLAR: Record<number, YilParametreleri> = {
  2026: YIL_2026,
};

/** Parametre dosyası olan en güncel yıl. */
export const VARSAYILAN_YIL = Math.max(...Object.keys(YILLAR).map(Number));

/** Para tutarlarını kuruşa yuvarlar. Bordroda her kalem 2 haneye yuvarlanır. */
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
 * Verilen kümülatif matrah için tarifeye göre toplam gelir vergisini hesaplar.
 *
 * Vergi yıl başından itibaren birikimli hesaplandığı için bir ayın vergisi
 * "bu aya kadarki toplam vergi − geçen aya kadarki toplam vergi" ile bulunur.
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

/** Kümülatif matrahın hangi vergi dilimine denk geldiğini döndürür. */
export function dilimOrani(kumulatifMatrah: number, dilimler: readonly VergiDilimi[]): number {
  for (const dilim of dilimler) {
    if (kumulatifMatrah <= dilim.ustSinir) return dilim.oran;
  }
  return dilimler[dilimler.length - 1]?.oran ?? 0;
}

/** Brüt maaşı SGK taban ve tavanı arasına sıkıştırır (prime esas kazanç). */
export function primeEsasKazanc(brut: number, p: YilParametreleri): number {
  return Math.min(Math.max(brut, p.sgkTaban), p.sgkTavan);
}

/**
 * 12 aylık bordroyu hesaplar.
 *
 * Türkiye'de gelir vergisi yıl boyunca birikimli olduğu için, brüt maaş hiç
 * değişmese bile üst dilime geçildiği ay net ücret düşer. Bu fonksiyon her ayı
 * ayrı ayrı hesaplayarak o düşüşü görünür kılar.
 */
export function yillikHesapla(brut: number, secenekler: HesapSecenekleri = {}): YillikSonuc {
  if (!Number.isFinite(brut) || brut <= 0) {
    throw new Error("Brüt maaş sıfırdan büyük bir sayı olmalı.");
  }

  const p = yilParametreleri(secenekler.yil);
  const istisnaUygula = secenekler.asgariUcretIstisnasi ?? true;

  // Asgari ücretlinin kendi bordrosu: istisna tutarı buradan çıkıyor.
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

    // Asgari ücretlinin o ayki vergisi = istisna tavanı.
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
 * Tek bir ayın bordrosunu hesaplar.
 *
 * @param brut Aylık brüt ücret
 * @param ay Yılın kaçıncı ayı (1 = Ocak). Kümülatif vergi yüzünden sonuç aya göre değişir.
 */
export function hesapla(brut: number, ay = 1, secenekler: HesapSecenekleri = {}): AylikBordro {
  if (!Number.isInteger(ay) || ay < 1 || ay > 12) {
    throw new Error("Ay 1 ile 12 arasında bir tam sayı olmalı.");
  }
  return yillikHesapla(brut, secenekler).aylar[ay - 1]!;
}

/** Brütten nete: sadece ele geçen tutarı döndürür. */
export function brutenNete(brut: number, ay = 1, secenekler: HesapSecenekleri = {}): number {
  return hesapla(brut, ay, secenekler).net;
}

/**
 * Netten brüte çevirir.
 *
 * Kesintiler artan oranlı olduğu için tersi doğrudan formülle bulunamaz;
 * ikili arama ile kuruş hassasiyetinde yaklaşılır.
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

  // 60 adım, 1e12 aralığı kuruşun çok altına indirmeye fazlasıyla yeter.
  for (let i = 0; i < 60; i++) {
    const orta = (alt + ust) / 2;
    if (brutenNete(orta, ay, secenekler) < net) alt = orta;
    else ust = orta;
  }

  // Kuruşa yuvarlamak neti hedefin bir kuruş altına düşürebilir; bir üst kuruşa çık.
  const brut = kurusaYuvarla(ust);
  return brutenNete(brut, ay, secenekler) < net ? kurusaYuvarla(brut + 0.01) : brut;
}

/** İşverene aylık maliyeti hesaplar: brüt + işveren primleri. */
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
