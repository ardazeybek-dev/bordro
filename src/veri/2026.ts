import type { YilParametreleri } from "../tipler.js";

/**
 * 2026 yılı bordro parametreleri.
 *
 * Buradaki her rakam resmî kaynaklara dayanır ve testlerle doğrulanır:
 * `test/asgari-ucret.test.ts` asgari ücretlinin netinin tam olarak
 * 28.075,50 TL çıktığını kontrol eder. Bir rakam yanlış girilirse
 * o test kırılır.
 */
export const YIL_2026: YilParametreleri = {
  yil: 2026,

  // Brüt asgari ücret: 33.030,00 TL/ay (net 28.075,50 TL)
  asgariUcretBrut: 33030,

  // SGK prime esas kazanç: alt sınır asgari ücret, üst sınır onun 9 katı
  sgkTaban: 33030,
  sgkTavan: 297270,

  // İşçiden kesilen primler
  sgkIsciOrani: 0.14,
  issizlikIsciOrani: 0.01,

  // İşverenin ödediği primler (%20,75 = %11 MYÖ + %7,5 GSS + %2,25 KVSK)
  sgkIsverenOrani: 0.2075,
  sgkIsverenIndirimliOrani: 0.1575, // 5510/81-ı: 5 puanlık indirim
  issizlikIsverenOrani: 0.02,

  // Ücretlerde damga vergisi: binde 7,59
  damgaVergisiOrani: 0.00759,

  // Ücret gelirlerine uygulanan artan oranlı tarife
  gelirVergisiDilimleri: [
    { ustSinir: 190_000, oran: 0.15 },
    { ustSinir: 400_000, oran: 0.2 },
    { ustSinir: 1_500_000, oran: 0.27 },
    { ustSinir: 5_300_000, oran: 0.35 },
    { ustSinir: Infinity, oran: 0.4 },
  ],

  kaynaklar: [
    "Vergi Merkezi — 2026 Pratik Bilgiler: https://vergimerkezi.com.tr/2026-pratik-bilgiler-mali-rehber/",
    "Kolay İK — 2026 gelir vergisi dilimleri: https://kolayik.com/blog/2026-gelir-vergisi-dilimleri-guncel-tablo",
    "Kolay İK — 2026 bordro parametreleri: https://kolayik.com/blog/2026-bordro-parametreleri",
    "CottGroup — 2026 yılı bordrodaki yasal kesintiler: https://www.cottgroup.com/tr/mevzuat/item/2026-yili-icin-bordrodaki-yasal-kesintiler",
  ],
};
