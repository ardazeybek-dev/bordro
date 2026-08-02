import { describe, expect, it } from "vitest";
import { hesapla, tarifeyeGoreVergi, yillikHesapla } from "../src/hesap.js";
import { YIL_2026 } from "../src/veri/2026.js";

const DILIMLER = YIL_2026.gelirVergisiDilimleri;

describe("gelir vergisi tarifesi", () => {
  it("ilk dilimde düz oran uygulanır", () => {
    expect(tarifeyeGoreVergi(100_000, DILIMLER)).toBeCloseTo(15_000, 2);
  });

  it("dilim sınırında sadece aşan kısım üst orandan vergilenir", () => {
    // 190.000 × %15 = 28.500 · aşan 10.000 × %20 = 2.000
    expect(tarifeyeGoreVergi(200_000, DILIMLER)).toBeCloseTo(30_500, 2);
  });

  it("tüm dilimleri aşan matrahta son oran uygulanır", () => {
    const besMilyonUcYuz =
      190_000 * 0.15 + 210_000 * 0.2 + 1_100_000 * 0.27 + 3_800_000 * 0.35;
    expect(tarifeyeGoreVergi(5_300_000, DILIMLER)).toBeCloseTo(besMilyonUcYuz, 2);
    expect(tarifeyeGoreVergi(6_300_000, DILIMLER)).toBeCloseTo(besMilyonUcYuz + 400_000, 2);
  });

  it("matrah sıfırken vergi de sıfırdır", () => {
    expect(tarifeyeGoreVergi(0, DILIMLER)).toBe(0);
  });
});

describe("kümülatif vergi — yıl içinde net maaşın düşmesi", () => {
  it("brüt sabitken net maaş yıl içinde azalır", () => {
    const yil = yillikHesapla(75_000);
    const ocak = yil.aylar[0]!;
    const aralik = yil.aylar[11]!;

    expect(aralik.net).toBeLessThan(ocak.net);
    expect(yil.netDegisimi).toBeLessThan(0);
  });

  it("yıl sonunda net maaş yıl başındakinden düşüktür", () => {
    for (const brut of [75_000, 120_000, 250_000]) {
      const yil = yillikHesapla(brut);
      expect(yil.aylar[11]!.net).toBeLessThan(yil.aylar[0]!.net);
    }
  });

  /**
   * Net maaş genelde azalır ama her ay azalmak zorunda değildir: asgari ücret
   * istisnası, asgari ücretlinin o ayki vergisine eşittir. Asgari ücretlinin
   * kümülatif matrahı da yıl içinde üst dilime geçtiği için istisna büyür ve
   * o ay yüksek maaşlının kesintisi azalıp neti hafifçe artabilir.
   */
  it("asgari ücretlinin dilim atladığı ay istisna büyür", () => {
    const asgari = yillikHesapla(YIL_2026.asgariUcretBrut);
    const gecisAyi = asgari.dilimGecisAylari[0];
    expect(gecisAyi).toBeDefined();

    const yuksek = yillikHesapla(120_000);
    const oncekiIstisna = yuksek.aylar[gecisAyi! - 2]!.gelirVergisiIstisnasi;
    const gecisIstisnasi = yuksek.aylar[gecisAyi! - 1]!.gelirVergisiIstisnasi;
    expect(gecisIstisnasi).toBeGreaterThan(oncekiIstisna);
  });

  it("dilim geçiş ayları işaretlenir", () => {
    const yil = yillikHesapla(75_000);
    expect(yil.dilimGecisAylari.length).toBeGreaterThan(0);
    for (const ay of yil.dilimGecisAylari) {
      expect(yil.aylar[ay - 1]!.dilimAtladi).toBe(true);
    }
  });

  it("kümülatif matrah her ay aylık matrah kadar artar", () => {
    const yil = yillikHesapla(50_000);
    const aylikMatrah = yil.aylar[0]!.gelirVergisiMatrahi;
    yil.aylar.forEach((ay, i) => {
      expect(ay.kumulatifMatrah).toBeCloseTo(aylikMatrah * (i + 1), 2);
    });
  });

  /**
   * Asgari ücretlinin yıllık matrahı 12 × 28.075,50 = 336.906 TL olduğu için
   * o da yıl içinde %20 dilimine geçer. Ama istisna aynı oranda büyüdüğünden
   * eline geçen tutar değişmez.
   */
  it("asgari ücretli dilim atlasa da neti sabit kalır", () => {
    const yil = yillikHesapla(YIL_2026.asgariUcretBrut);
    expect(yil.dilimGecisAylari.length).toBeGreaterThan(0);
    expect(yil.netDegisimi).toBe(0);
  });

  it("yıllık toplamlar aylık kalemlerin toplamına eşittir", () => {
    const yil = yillikHesapla(90_000);
    const elleToplam = yil.aylar.reduce((t, a) => t + a.net, 0);
    expect(yil.toplam.net).toBeCloseTo(elleToplam, 2);
    expect(yil.toplam.brut).toBeCloseTo(90_000 * 12, 2);
  });
});

describe("bordro kalemleri tutarlı", () => {
  it("net = brüt − kesintiler", () => {
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

  it("gelir vergisi matrahı = brüt − SGK kesintileri", () => {
    const b = hesapla(75_000);
    expect(b.gelirVergisiMatrahi).toBeCloseTo(b.brut - b.sgkIsci - b.issizlikIsci, 2);
  });

  it("kesilen vergi hiçbir zaman negatif olmaz", () => {
    for (const brut of [33_030, 35_000, 40_000]) {
      const yil = yillikHesapla(brut);
      for (const ay of yil.aylar) {
        expect(ay.gelirVergisi).toBeGreaterThanOrEqual(0);
        expect(ay.damgaVergisi).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
