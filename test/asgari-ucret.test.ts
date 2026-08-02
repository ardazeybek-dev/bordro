import { describe, expect, it } from "vitest";
import { hesapla, yillikHesapla } from "../src/hesap.js";
import { YIL_2026 } from "../src/veri/2026.js";

/**
 * Bu dosya projenin güvenlik ağıdır.
 *
 * Asgari ücretin brütü ve neti resmen ilan edilen, herkesin bildiği iki
 * rakamdır. Parametrelerden herhangi biri (SGK oranı, vergi dilimi, damga
 * vergisi, istisna mantığı) yanlış olursa bu testler kırılır.
 */
describe("2026 asgari ücret", () => {
  const BRUT = 33030;
  const NET = 28075.5;

  it("brüt asgari ücret parametresi resmî tutara eşit", () => {
    expect(YIL_2026.asgariUcretBrut).toBe(BRUT);
  });

  it("asgari ücretlinin neti tam olarak 28.075,50 TL", () => {
    expect(hesapla(BRUT, 1).net).toBe(NET);
  });

  it("asgari ücretliden gelir vergisi ve damga vergisi kesilmez", () => {
    const ocak = hesapla(BRUT, 1);
    expect(ocak.gelirVergisi).toBe(0);
    expect(ocak.damgaVergisi).toBe(0);
  });

  it("asgari ücretlinin neti yıl boyunca sabit kalır", () => {
    const yil = yillikHesapla(BRUT);
    for (const ay of yil.aylar) {
      expect(ay.net).toBe(NET);
    }
  });

  it("asgari ücretlinin tek kesintisi SGK ve işsizlik primidir", () => {
    const ocak = hesapla(BRUT, 1);
    expect(ocak.sgkIsci).toBe(4624.2); // 33.030 × %14
    expect(ocak.issizlikIsci).toBe(330.3); // 33.030 × %1
    expect(ocak.kesintiler).toBe(4954.5);
  });

  it("istisna kapatılırsa asgari ücretliden de vergi kesilir", () => {
    const ocak = hesapla(BRUT, 1, { asgariUcretIstisnasi: false });
    expect(ocak.gelirVergisi).toBeGreaterThan(0);
    expect(ocak.damgaVergisi).toBeGreaterThan(0);
    expect(ocak.net).toBeLessThan(NET);
  });
});
