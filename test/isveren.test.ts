import { describe, expect, it } from "vitest";
import { hesapla, isvereneMaliyet } from "../src/hesap.js";
import { YIL_2026 } from "../src/veri/2026.js";

describe("employer cost", () => {
  it("cost = gross + employer social security + employer unemployment", () => {
    const m = isvereneMaliyet(75_000);
    expect(m.sgkIsveren).toBeCloseTo(75_000 * 0.2075, 2);
    expect(m.issizlikIsveren).toBeCloseTo(75_000 * 0.02, 2);
    expect(m.toplamMaliyet).toBeCloseTo(75_000 * 1.2275, 2);
  });

  it("the 5-point discount lowers the cost", () => {
    const normal = isvereneMaliyet(75_000);
    const indirimli = isvereneMaliyet(75_000, { besPuanIndirimi: true });
    expect(indirimli.toplamMaliyet).toBeLessThan(normal.toplamMaliyet);
    expect(normal.toplamMaliyet - indirimli.toplamMaliyet).toBeCloseTo(75_000 * 0.05, 2);
    expect(indirimli.indirimUygulandi).toBe(true);
  });

  it("employer cost of a minimum wage earner", () => {
    const m = isvereneMaliyet(YIL_2026.asgariUcretBrut);
    expect(m.toplamMaliyet).toBeCloseTo(33_030 * 1.2275, 2);
  });

  it("above the social security ceiling the employer premium is fixed too", () => {
    const tavanda = isvereneMaliyet(YIL_2026.sgkTavan);
    const uzerinde = isvereneMaliyet(YIL_2026.sgkTavan * 2);
    expect(tavanda.sgkIsveren).toBe(uzerinde.sgkIsveren);
    // Total cost still rises because the gross itself rises.
    expect(uzerinde.toplamMaliyet).toBeGreaterThan(tavanda.toplamMaliyet);
  });

  it("cost is always greater than the gross", () => {
    for (const brut of [33_030, 75_000, 500_000]) {
      expect(isvereneMaliyet(brut).toplamMaliyet).toBeGreaterThan(brut);
    }
  });

  it("the gap between what the employer pays and the employee receives", () => {
    const maliyet = isvereneMaliyet(75_000).toplamMaliyet;
    const net = hesapla(75_000, 1).net;
    expect(maliyet).toBeGreaterThan(net);
    // Take-home pay is around 70% of what the employer pays.
    expect(net / maliyet).toBeGreaterThan(0.5);
    expect(net / maliyet).toBeLessThan(0.8);
  });

  it("an invalid gross is rejected", () => {
    expect(() => isvereneMaliyet(0)).toThrow();
    expect(() => isvereneMaliyet(-100)).toThrow();
  });
});
