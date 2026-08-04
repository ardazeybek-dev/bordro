import { describe, expect, it } from "vitest";
import { hesapla, yillikHesapla } from "../src/hesap.js";
import { YIL_2026 } from "../src/veri/2026.js";

/**
 * This file is the project's safety net.
 *
 * The gross and net minimum wage are two officially announced figures that
 * everybody knows. If any parameter is wrong — a social security rate, a tax
 * bracket, the stamp duty, the exemption logic — these tests break.
 */
describe("2026 minimum wage", () => {
  const BRUT = 33030;
  const NET = 28075.5;

  it("the gross minimum wage parameter matches the official figure", () => {
    expect(YIL_2026.asgariUcretBrut).toBe(BRUT);
  });

  it("the minimum wage earner nets exactly 28,075.50 TRY", () => {
    expect(hesapla(BRUT, 1).net).toBe(NET);
  });

  it("no income tax or stamp duty is withheld from a minimum wage earner", () => {
    const ocak = hesapla(BRUT, 1);
    expect(ocak.gelirVergisi).toBe(0);
    expect(ocak.damgaVergisi).toBe(0);
  });

  it("the minimum wage earner's net stays flat all year", () => {
    const yil = yillikHesapla(BRUT);
    for (const ay of yil.aylar) {
      expect(ay.net).toBe(NET);
    }
  });

  it("social security and unemployment premiums are the only deductions", () => {
    const ocak = hesapla(BRUT, 1);
    expect(ocak.sgkIsci).toBe(4624.2); // 33.030 × %14
    expect(ocak.issizlikIsci).toBe(330.3); // 33.030 × %1
    expect(ocak.kesintiler).toBe(4954.5);
  });

  it("turning the exemption off does withhold tax from the minimum wage", () => {
    const ocak = hesapla(BRUT, 1, { asgariUcretIstisnasi: false });
    expect(ocak.gelirVergisi).toBeGreaterThan(0);
    expect(ocak.damgaVergisi).toBeGreaterThan(0);
    expect(ocak.net).toBeLessThan(NET);
  });
});
