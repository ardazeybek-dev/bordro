import { describe, expect, it } from "vitest";
import { hesapla, nettenBrute, primeEsasKazanc, yilParametreleri } from "../src/hesap.js";
import { YIL_2026 } from "../src/veri/2026.js";

describe("SGK taban ve tavanı", () => {
  it("asgari ücretin altında prim tabandan hesaplanır", () => {
    expect(primeEsasKazanc(10_000, YIL_2026)).toBe(YIL_2026.sgkTaban);
  });

  it("tavanı aşan maaşta prim tavandan hesaplanır", () => {
    expect(primeEsasKazanc(500_000, YIL_2026)).toBe(YIL_2026.sgkTavan);
  });

  it("tavan üstü maaşlarda SGK kesintisi sabit kalır", () => {
    const tavanUstu = hesapla(400_000, 1);
    const cokDahaUstu = hesapla(900_000, 1);
    expect(tavanUstu.sgkIsci).toBe(cokDahaUstu.sgkIsci);
    expect(tavanUstu.issizlikIsci).toBe(cokDahaUstu.issizlikIsci);
  });

  it("SGK tavanı asgari ücretin 9 katıdır", () => {
    expect(YIL_2026.sgkTavan).toBe(YIL_2026.asgariUcretBrut * 9);
  });

  it("damga vergisi brütün binde 7,59'udur", () => {
    const b = hesapla(200_000, 1);
    expect(b.hesaplananDamgaVergisi).toBeCloseTo(200_000 * 0.00759, 2);
  });
});

describe("netten brüte", () => {
  it("çevrim geri döndüğünde aynı neti verir", () => {
    for (const net of [28_075.5, 40_000, 57_000, 100_000]) {
      for (const ay of [1, 7]) {
        const brut = nettenBrute(net, ay);
        expect(hesapla(brut, ay).net).toBeCloseTo(net, 2);
      }
    }
  });

  it("bulunan brüt hedef netin altında kalmaz", () => {
    for (const net of [30_000, 50_000, 85_000]) {
      const brut = nettenBrute(net, 1);
      expect(hesapla(brut, 1).net).toBeGreaterThanOrEqual(net);
    }
  });

  it("net asgari ücretin brüt karşılığı asgari ücrettir", () => {
    expect(nettenBrute(28_075.5, 1)).toBeCloseTo(YIL_2026.asgariUcretBrut, 0);
  });

  it("aynı net için yılın ilerleyen ayında daha yüksek brüt gerekir", () => {
    expect(nettenBrute(60_000, 12)).toBeGreaterThan(nettenBrute(60_000, 1));
  });
});

describe("hatalı girdiler", () => {
  it("sıfır veya negatif brüt reddedilir", () => {
    expect(() => hesapla(0)).toThrow();
    expect(() => hesapla(-1000)).toThrow();
    expect(() => hesapla(Number.NaN)).toThrow();
  });

  it("geçersiz ay reddedilir", () => {
    expect(() => hesapla(50_000, 0)).toThrow();
    expect(() => hesapla(50_000, 13)).toThrow();
    expect(() => hesapla(50_000, 1.5)).toThrow();
  });

  it("parametresi olmayan yıl reddedilir", () => {
    expect(() => yilParametreleri(1999)).toThrow(/1999/);
  });

  it("sıfır veya negatif net reddedilir", () => {
    expect(() => nettenBrute(0)).toThrow();
    expect(() => nettenBrute(-5)).toThrow();
  });
});
