import { describe, expect, it } from "vitest";
import { hesapla, isvereneMaliyet } from "../src/hesap.js";
import { YIL_2026 } from "../src/veri/2026.js";

describe("işverene maliyet", () => {
  it("maliyet = brüt + SGK işveren payı + işsizlik işveren payı", () => {
    const m = isvereneMaliyet(75_000);
    expect(m.sgkIsveren).toBeCloseTo(75_000 * 0.2075, 2);
    expect(m.issizlikIsveren).toBeCloseTo(75_000 * 0.02, 2);
    expect(m.toplamMaliyet).toBeCloseTo(75_000 * 1.2275, 2);
  });

  it("5 puanlık indirim maliyeti düşürür", () => {
    const normal = isvereneMaliyet(75_000);
    const indirimli = isvereneMaliyet(75_000, { besPuanIndirimi: true });
    expect(indirimli.toplamMaliyet).toBeLessThan(normal.toplamMaliyet);
    expect(normal.toplamMaliyet - indirimli.toplamMaliyet).toBeCloseTo(75_000 * 0.05, 2);
    expect(indirimli.indirimUygulandi).toBe(true);
  });

  it("asgari ücretlinin işverene maliyeti", () => {
    const m = isvereneMaliyet(YIL_2026.asgariUcretBrut);
    expect(m.toplamMaliyet).toBeCloseTo(33_030 * 1.2275, 2);
  });

  it("SGK tavanı üstünde işveren primi de sabitlenir", () => {
    const tavanda = isvereneMaliyet(YIL_2026.sgkTavan);
    const uzerinde = isvereneMaliyet(YIL_2026.sgkTavan * 2);
    expect(tavanda.sgkIsveren).toBe(uzerinde.sgkIsveren);
    // Brüt arttığı için toplam maliyet yine de artar.
    expect(uzerinde.toplamMaliyet).toBeGreaterThan(tavanda.toplamMaliyet);
  });

  it("maliyet her zaman brütten büyüktür", () => {
    for (const brut of [33_030, 75_000, 500_000]) {
      expect(isvereneMaliyet(brut).toplamMaliyet).toBeGreaterThan(brut);
    }
  });

  it("işverenin ödediği ile çalışanın aldığı arasındaki fark", () => {
    const maliyet = isvereneMaliyet(75_000).toplamMaliyet;
    const net = hesapla(75_000, 1).net;
    expect(maliyet).toBeGreaterThan(net);
    // Çalışanın eline geçen, işverenin ödediğinin %70'i civarıdır.
    expect(net / maliyet).toBeGreaterThan(0.5);
    expect(net / maliyet).toBeLessThan(0.8);
  });

  it("geçersiz brüt reddedilir", () => {
    expect(() => isvereneMaliyet(0)).toThrow();
    expect(() => isvereneMaliyet(-100)).toThrow();
  });
});
