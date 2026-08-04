import { describe, expect, it } from "vitest";
import { hesapla, tarifeyeGoreVergi, yillikHesapla } from "../src/hesap.js";
import { YIL_2026 } from "../src/veri/2026.js";

const DILIMLER = YIL_2026.gelirVergisiDilimleri;

describe("income tax schedule", () => {
  it("the first bracket applies a flat rate", () => {
    expect(tarifeyeGoreVergi(100_000, DILIMLER)).toBeCloseTo(15_000, 2);
  });

  it("at a bracket boundary only the excess is taxed at the higher rate", () => {
    // 190,000 x 15% = 28,500 · the excess 10,000 x 20% = 2,000
    expect(tarifeyeGoreVergi(200_000, DILIMLER)).toBeCloseTo(30_500, 2);
  });

  it("a base above every bracket uses the last rate", () => {
    const besMilyonUcYuz =
      190_000 * 0.15 + 210_000 * 0.2 + 1_100_000 * 0.27 + 3_800_000 * 0.35;
    expect(tarifeyeGoreVergi(5_300_000, DILIMLER)).toBeCloseTo(besMilyonUcYuz, 2);
    expect(tarifeyeGoreVergi(6_300_000, DILIMLER)).toBeCloseTo(besMilyonUcYuz + 400_000, 2);
  });

  it("a zero base means zero tax", () => {
    expect(tarifeyeGoreVergi(0, DILIMLER)).toBe(0);
  });
});

describe("cumulative tax — net pay falling during the year", () => {
  it("net pay falls during the year while the gross stays flat", () => {
    const yil = yillikHesapla(75_000);
    const ocak = yil.aylar[0]!;
    const aralik = yil.aylar[11]!;

    expect(aralik.net).toBeLessThan(ocak.net);
    expect(yil.netDegisimi).toBeLessThan(0);
  });

  it("net pay at the end of the year is below the start of the year", () => {
    for (const brut of [75_000, 120_000, 250_000]) {
      const yil = yillikHesapla(brut);
      expect(yil.aylar[11]!.net).toBeLessThan(yil.aylar[0]!.net);
    }
  });

  /**
   * Net pay usually falls, but it does not have to fall every month: the
   * minimum wage exemption equals the minimum wage earner's tax for that month.
   * Their cumulative base also crosses into a higher bracket during the year,
   * so the exemption grows, and in that month a higher earner's deduction can
   * shrink and their net tick up slightly.
   */
  it("the exemption grows in the month the minimum wage changes bracket", () => {
    const asgari = yillikHesapla(YIL_2026.asgariUcretBrut);
    const gecisAyi = asgari.dilimGecisAylari[0];
    expect(gecisAyi).toBeDefined();

    const yuksek = yillikHesapla(120_000);
    const oncekiIstisna = yuksek.aylar[gecisAyi! - 2]!.gelirVergisiIstisnasi;
    const gecisIstisnasi = yuksek.aylar[gecisAyi! - 1]!.gelirVergisiIstisnasi;
    expect(gecisIstisnasi).toBeGreaterThan(oncekiIstisna);
  });

  it("bracket change months are flagged", () => {
    const yil = yillikHesapla(75_000);
    expect(yil.dilimGecisAylari.length).toBeGreaterThan(0);
    for (const ay of yil.dilimGecisAylari) {
      expect(yil.aylar[ay - 1]!.dilimAtladi).toBe(true);
    }
  });

  it("the cumulative base grows by the monthly base each month", () => {
    const yil = yillikHesapla(50_000);
    const aylikMatrah = yil.aylar[0]!.gelirVergisiMatrahi;
    yil.aylar.forEach((ay, i) => {
      expect(ay.kumulatifMatrah).toBeCloseTo(aylikMatrah * (i + 1), 2);
    });
  });

  /**
   * The minimum wage earner's annual base is 12 x 28,075.50 = 336,906 TRY, so
   * they cross into the 20% bracket during the year as well. The exemption grows
   * by the same amount, so their take-home pay does not change.
   */
  it("the minimum wage net stays flat even across a bracket change", () => {
    const yil = yillikHesapla(YIL_2026.asgariUcretBrut);
    expect(yil.dilimGecisAylari.length).toBeGreaterThan(0);
    expect(yil.netDegisimi).toBe(0);
  });

  it("the annual totals equal the sum of the monthly lines", () => {
    const yil = yillikHesapla(90_000);
    const elleToplam = yil.aylar.reduce((t, a) => t + a.net, 0);
    expect(yil.toplam.net).toBeCloseTo(elleToplam, 2);
    expect(yil.toplam.brut).toBeCloseTo(90_000 * 12, 2);
  });
});

describe("payroll lines are consistent", () => {
  it("net = gross - deductions", () => {
    for (const brut of [33_030, 50_000, 75_000, 150_000, 400_000]) {
      for (const ay of [1, 6, 12]) {
        const b = hesapla(brut, ay);
        expect(b.net).toBeCloseTo(b.brut - b.kesintiler, 2);
        expect(b.kesintiler).toBeCloseTo(
          b.sgkIsci + b.issizlikIsci + b.gelirVergisi + b.damgaVergisi,
          2,
        );
      }
    }
  });

  it("income tax base = gross - social security deductions", () => {
    const b = hesapla(75_000);
    expect(b.gelirVergisiMatrahi).toBeCloseTo(b.brut - b.sgkIsci - b.issizlikIsci, 2);
  });

  it("withheld tax is never negative", () => {
    for (const brut of [33_030, 35_000, 40_000]) {
      const yil = yillikHesapla(brut);
      for (const ay of yil.aylar) {
        expect(ay.gelirVergisi).toBeGreaterThanOrEqual(0);
        expect(ay.damgaVergisi).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
