import { describe, expect, it } from "vitest";
import { hesapla, nettenBrute, primeEsasKazanc, yilParametreleri } from "../src/hesap.js";
import { YIL_2026 } from "../src/veri/2026.js";

describe("social security floor and ceiling", () => {
  it("below the minimum wage the premium is charged on the floor", () => {
    expect(primeEsasKazanc(10_000, YIL_2026)).toBe(YIL_2026.sgkTaban);
  });

  it("above the ceiling the premium is charged on the ceiling", () => {
    expect(primeEsasKazanc(500_000, YIL_2026)).toBe(YIL_2026.sgkTavan);
  });

  it("the social security deduction is fixed above the ceiling", () => {
    const tavanUstu = hesapla(400_000, 1);
    const cokDahaUstu = hesapla(900_000, 1);
    expect(tavanUstu.sgkIsci).toBe(cokDahaUstu.sgkIsci);
    expect(tavanUstu.issizlikIsci).toBe(cokDahaUstu.issizlikIsci);
  });

  it("the social security ceiling is 9x the minimum wage", () => {
    expect(YIL_2026.sgkTavan).toBe(YIL_2026.asgariUcretBrut * 9);
  });

  it("stamp duty is 0.759 per cent of the gross", () => {
    const b = hesapla(200_000, 1);
    expect(b.hesaplananDamgaVergisi).toBeCloseTo(200_000 * 0.00759, 2);
  });
});

describe("net to gross", () => {
  it("converting back returns the same net", () => {
    for (const net of [28_075.5, 40_000, 57_000, 100_000]) {
      for (const ay of [1, 7]) {
        const brut = nettenBrute(net, ay);
        expect(hesapla(brut, ay).net).toBeCloseTo(net, 2);
      }
    }
  });

  it("the gross it finds never lands below the target net", () => {
    for (const net of [30_000, 50_000, 85_000]) {
      const brut = nettenBrute(net, 1);
      expect(hesapla(brut, 1).net).toBeGreaterThanOrEqual(net);
    }
  });

  it("the gross for the net minimum wage is the minimum wage", () => {
    expect(nettenBrute(28_075.5, 1)).toBeCloseTo(YIL_2026.asgariUcretBrut, 0);
  });

  it("the same net needs a higher gross later in the year", () => {
    expect(nettenBrute(60_000, 12)).toBeGreaterThan(nettenBrute(60_000, 1));
  });
});

describe("invalid input", () => {
  it("a zero or negative gross is rejected", () => {
    expect(() => hesapla(0)).toThrow();
    expect(() => hesapla(-1000)).toThrow();
    expect(() => hesapla(Number.NaN)).toThrow();
  });

  it("an invalid month is rejected", () => {
    expect(() => hesapla(50_000, 0)).toThrow();
    expect(() => hesapla(50_000, 13)).toThrow();
    expect(() => hesapla(50_000, 1.5)).toThrow();
  });

  it("a year without parameters is rejected", () => {
    expect(() => yilParametreleri(1999)).toThrow(/1999/);
  });

  it("a zero or negative net is rejected", () => {
    expect(() => nettenBrute(0)).toThrow();
    expect(() => nettenBrute(-5)).toThrow();
  });
});
