#!/usr/bin/env node
import { AY_ADLARI, sayiyaCevir, tl, tlSimgeli, yuzde } from "./bicim.js";
import {
  VARSAYILAN_YIL,
  isvereneMaliyet,
  nettenBrute,
  yilParametreleri,
  yillikHesapla,
} from "./hesap.js";
import type { HesapSecenekleri } from "./tipler.js";

const renkliMi = process.stdout.isTTY === true && !process.env["NO_COLOR"];
const r = (kod: string, metin: string) => (renkliMi ? `\u001b[${kod}m${metin}\u001b[0m` : metin);
const kalin = (m: string) => r("1", m);
const soluk = (m: string) => r("2", m);
const sari = (m: string) => r("33", m);
const yesil = (m: string) => r("32", m);

const YARDIM = `
${kalin("bordro")} — Türkiye maaş hesaplama aracı (${VARSAYILAN_YIL})

${kalin("KULLANIM")}
  bordro <brüt maaş>              Brütten nete, 12 aylık döküm
  bordro --net <net maaş>         Netten brüte çevir
  bordro <brüt maaş> --isveren    İşverene maliyeti göster

${kalin("SEÇENEKLER")}
  --net <tutar>      Verilen net ücretin brüt karşılığını bulur
  --isveren          İşveren maliyeti dökümünü gösterir
  --ay <1-12>        Tek bir ayı hesaplar (varsayılan: 12 aylık tablo)
  --yil <yıl>        Hesaplanacak yıl (varsayılan: ${VARSAYILAN_YIL})
  --indirim          SGK işveren payına 5 puanlık indirim uygular
  --istisnasiz       Asgari ücret vergi istisnasını uygulamaz
  --json             Sonucu JSON olarak yazdırır
  -y, --yardim       Bu yardımı gösterir

${kalin("ÖRNEKLER")}
  bordro 75000
  bordro 75000 --isveren --indirim
  bordro --net 50000
  bordro 120000 --ay 7 --json
`;

interface Argumanlar {
  tutar?: number;
  netMi: boolean;
  isverenMi: boolean;
  ay?: number;
  jsonMu: boolean;
  secenekler: HesapSecenekleri;
}

function argumanlariCozumle(argv: string[]): Argumanlar {
  const sonuc: Argumanlar = {
    netMi: false,
    isverenMi: false,
    jsonMu: false,
    secenekler: {},
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    switch (arg) {
      case "--net":
        sonuc.netMi = true;
        sonuc.tutar = sayiyaCevir(argv[++i] ?? "");
        break;
      case "--isveren":
        sonuc.isverenMi = true;
        break;
      case "--ay":
        sonuc.ay = Number(argv[++i]);
        break;
      case "--yil":
        sonuc.secenekler.yil = Number(argv[++i]);
        break;
      case "--indirim":
        sonuc.secenekler.besPuanIndirimi = true;
        break;
      case "--istisnasiz":
        sonuc.secenekler.asgariUcretIstisnasi = false;
        break;
      case "--json":
        sonuc.jsonMu = true;
        break;
      default:
        if (arg.startsWith("-")) throw new Error(`Bilinmeyen seçenek: ${arg}`);
        sonuc.tutar = sayiyaCevir(arg);
    }
  }
  return sonuc;
}

function sag(metin: string, genislik: number): string {
  return metin.padStart(genislik);
}

function calisanTablosu(brut: number, secenekler: HesapSecenekleri, ay?: number): string {
  const sonuc = yillikHesapla(brut, secenekler);
  const satirlar: string[] = [];

  satirlar.push("");
  satirlar.push(
    `  ${kalin(`Brüt ${tlSimgeli(brut)}`)}  ${soluk(`· ${sonuc.yil} · aylık bordro`)}`,
  );
  satirlar.push("");
  satirlar.push(
    soluk(
      `  ${"Ay".padEnd(9)}${sag("SGK+İşsizlik", 14)}${sag("Gelir vergisi", 15)}${sag("Damga", 10)}${sag("NET", 15)}   Dilim`,
    ),
  );
  satirlar.push(soluk(`  ${"─".repeat(69)}`));

  const gosterilecek = ay ? [sonuc.aylar[ay - 1]!] : sonuc.aylar;
  for (const a of gosterilecek) {
    const sgkToplam = a.sgkIsci + a.issizlikIsci;
    const dilim = yuzde(a.vergiDilimiOrani);
    const satir =
      `  ${AY_ADLARI[a.ay - 1]!.padEnd(9)}` +
      `${sag(tl(sgkToplam), 14)}${sag(tl(a.gelirVergisi), 15)}` +
      `${sag(tl(a.damgaVergisi), 10)}${kalin(sag(tl(a.net), 15))}` +
      `   ${sag(dilim, 4)}`;
    satirlar.push(a.dilimAtladi ? `${satir}  ${sari("← dilim atladı")}` : satir);
  }

  if (!ay) {
    satirlar.push(soluk(`  ${"─".repeat(69)}`));
    satirlar.push(
      `  ${"Yıllık".padEnd(9)}${sag(tl(sonuc.toplam.sgkIsci + sonuc.toplam.issizlikIsci), 14)}` +
        `${sag(tl(sonuc.toplam.gelirVergisi), 15)}${sag(tl(sonuc.toplam.damgaVergisi), 10)}` +
        `${kalin(sag(tl(sonuc.toplam.net), 15))}`,
    );
    satirlar.push("");

    if (sonuc.dilimGecisAylari.length > 0) {
      const aylar = sonuc.dilimGecisAylari.map((a) => AY_ADLARI[a - 1]).join(", ");
      satirlar.push(`  ${sari("!")} Vergi dilimi ${aylar} aylarında değişti.`);
      satirlar.push(
        `    Zam almasan da Aralık'ta eline ${kalin(tlSimgeli(Math.abs(sonuc.netDegisimi)))} ` +
          `${sonuc.netDegisimi < 0 ? "daha az" : "daha çok"} geçiyor.`,
      );
      satirlar.push("");
    }
  }

  return satirlar.join("\n");
}

function isverenTablosu(brut: number, secenekler: HesapSecenekleri): string {
  const m = isvereneMaliyet(brut, secenekler);
  const calisan = yillikHesapla(brut, secenekler).aylar[0]!;
  const p = yilParametreleri(secenekler.yil);
  const oran = m.indirimUygulandi ? p.sgkIsverenIndirimliOrani : p.sgkIsverenOrani;

  const satir = (etiket: string, tutar: number, not = "") =>
    `  ${etiket.padEnd(30)}${sag(tl(tutar), 16)}${not ? `  ${soluk(not)}` : ""}`;

  return [
    "",
    `  ${kalin(`Brüt ${tlSimgeli(brut)}`)}  ${soluk(`· ${p.yil} · işverene maliyet`)}`,
    "",
    satir("Brüt maaş", m.brut),
    satir("SGK işveren payı", m.sgkIsveren, yuzde(oran) + (m.indirimUygulandi ? " (5 puan indirimli)" : "")),
    satir("İşsizlik işveren payı", m.issizlikIsveren, yuzde(p.issizlikIsverenOrani)),
    soluk(`  ${"─".repeat(48)}`),
    `  ${kalin("AYLIK TOPLAM MALİYET".padEnd(30))}${kalin(sag(tl(m.toplamMaliyet), 16))}`,
    `  ${"Yıllık toplam maliyet".padEnd(30)}${sag(tl(m.toplamMaliyet * 12), 16)}`,
    "",
    `  ${soluk("Çalışanın Ocak'ta eline geçen:")} ${kalin(tlSimgeli(calisan.net))}`,
    `  ${soluk("Aradaki fark:")} ${tlSimgeli(m.toplamMaliyet - calisan.net)} ` +
      soluk(`(maliyetin ${yuzde(1 - calisan.net / m.toplamMaliyet)}'i vergi ve prim)`),
    "",
  ].join("\n");
}

function calistir(argv: string[]): number {
  if (argv.length === 0 || argv.includes("--yardim") || argv.includes("-y")) {
    console.log(YARDIM);
    return 0;
  }

  const a = argumanlariCozumle(argv);
  if (a.tutar === undefined) {
    console.error("Hata: maaş tutarı belirtilmedi. Yardım için: bordro --yardim");
    return 1;
  }

  const brut = a.netMi ? nettenBrute(a.tutar, a.ay ?? 1, a.secenekler) : a.tutar;

  if (a.jsonMu) {
    const veri = a.isverenMi
      ? isvereneMaliyet(brut, a.secenekler)
      : yillikHesapla(brut, a.secenekler);
    console.log(JSON.stringify(veri, null, 2));
    return 0;
  }

  if (a.netMi) {
    console.log(
      `\n  Net ${kalin(tlSimgeli(a.tutar))} almak için brüt ${yesil(kalin(tlSimgeli(brut)))} gerekir.` +
        soluk(`  (${AY_ADLARI[(a.ay ?? 1) - 1]} ayı için)`),
    );
  }

  console.log(a.isverenMi ? isverenTablosu(brut, a.secenekler) : calisanTablosu(brut, a.secenekler, a.ay));
  return 0;
}

try {
  process.exitCode = calistir(process.argv.slice(2));
} catch (hata) {
  console.error(`Hata: ${hata instanceof Error ? hata.message : String(hata)}`);
  process.exitCode = 1;
}
