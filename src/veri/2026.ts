import type { YilParametreleri } from "../tipler.js";

/**
 * Payroll parameters for 2026.
 *
 * Every figure here comes from an official source and is covered by a test:
 * `test/asgari-ucret.test.ts` checks that the minimum wage earner's net comes
 * out at exactly 28,075.50 TRY. Get one number wrong and that test breaks.
 */
export const YIL_2026: YilParametreleri = {
  yil: 2026,

  // Gross minimum wage: 33,030.00 TRY/month (28,075.50 TRY net)
  asgariUcretBrut: 33030,

  // Social security earnings: the floor is the minimum wage, the ceiling is 9x that
  sgkTaban: 33030,
  sgkTavan: 297270,

  // Premiums withheld from the employee
  sgkIsciOrani: 0.14,
  issizlikIsciOrani: 0.01,

  // Premiums paid by the employer (20.75% = 11% disability/old age/death + 7.5% health + 2.25% short-term)
  sgkIsverenOrani: 0.2075,
  sgkIsverenIndirimliOrani: 0.1575, // law 5510 art. 81-i: the 5-point discount
  issizlikIsverenOrani: 0.02,

  // Stamp duty on wages: 0.759 per cent
  damgaVergisiOrani: 0.00759,

  // The progressive schedule applied to wage income
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
