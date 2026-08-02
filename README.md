# bordro

[![CI](https://github.com/ardazeybek-dev/bordro/actions/workflows/ci.yml/badge.svg)](https://github.com/ardazeybek-dev/bordro/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/bordro.svg)](https://www.npmjs.com/package/bordro)
[![lisans](https://img.shields.io/npm/l/bordro.svg)](LICENSE)

Türkiye maaş bordrosu hesaplama kütüphanesi. Brütten nete, netten brüte, işverene maliyet —
ve internetteki hesaplayıcıların çoğunun atladığı şey: **12 aylık birikimli vergi.**

**[Tarayıcıda dene →](https://ardazeybek-dev.github.io/bordro/)**

```bash
npm install bordro
```

## Neden başka bir maaş hesaplayıcı?

Türkiye'de gelir vergisi yıl başından itibaren **birikimli** hesaplanır. Yani brüt maaşın hiç
değişmese bile, birikimli matrahın üst dilime geçtiği ay elinize daha az para geçer:

```
Brüt 75.000 ₺ — 2026, hiç zam yok

Ocak      58.080,28 ₺   %15
Mart      58.017,78 ₺   %20  ← dilim atladı
Nisan     54.892,77 ₺   %20
Temmuz    51.981,70 ₺   %27  ← dilim atladı
Aralık    51.834,05 ₺   %27

Ocak → Aralık farkı: −6.246,23 ₺
```

Tek ay hesaplayan araçlar bu düşüşü göstermez. `bordro` 12 ayın tamamını hesaplar ve vergi
diliminin hangi ay değiştiğini işaretler.

## Kullanım

### Kütüphane

```js
import { hesapla, yillikHesapla, nettenBrute, isvereneMaliyet } from "bordro";

// Tek ayın bordrosu (varsayılan: Ocak)
hesapla(75000).net;              // 58080.28
hesapla(75000, 7).net;           // 51981.70  — Temmuz, üst dilimde

// 12 aylık döküm
const yil = yillikHesapla(75000);
yil.toplam.net;                  // 650008.62
yil.dilimGecisAylari;            // [3, 7]  — Mart ve Temmuz
yil.netDegisimi;                 // -6246.23

// Netten brüte
nettenBrute(50000);              // 63697.48

// İşverene maliyet
isvereneMaliyet(75000).toplamMaliyet;                        // 92062.50
isvereneMaliyet(75000, { besPuanIndirimi: true }).toplamMaliyet; // 88312.50
```

### Komut satırı

```bash
npx bordro 75000              # brütten nete, 12 aylık tablo
npx bordro --net 50000        # netten brüte
npx bordro 75000 --isveren    # işverene maliyet
npx bordro 120000 --ay 7      # sadece Temmuz
npx bordro 75000 --json       # JSON çıktı
```

```
  Brüt 75.000,00 ₺  · 2026 · aylık bordro

  Ay         SGK+İşsizlik  Gelir vergisi     Damga            NET   Dilim
  ─────────────────────────────────────────────────────────────────────
  Ocak          11.250,00       5.351,17    318,55      58.080,28    %15
  Şubat         11.250,00       5.351,17    318,55      58.080,28    %15
  Mart          11.250,00       5.413,67    318,55      58.017,78    %20  ← dilim atladı
  ...
```

## API

| Fonksiyon | Döndürdüğü |
|---|---|
| `hesapla(brut, ay?, secenekler?)` | O ayın tam bordro dökümü (`AylikBordro`) |
| `yillikHesapla(brut, secenekler?)` | 12 aylık döküm + yıllık toplamlar (`YillikSonuc`) |
| `brutenNete(brut, ay?, secenekler?)` | Sadece net tutar |
| `nettenBrute(net, ay?, secenekler?)` | Hedef neti veren brüt ücret |
| `isvereneMaliyet(brut, secenekler?)` | İşveren primleri + toplam maliyet |
| `yilParametreleri(yil?)` | O yılın yasal parametreleri |

**Seçenekler:** `{ yil, asgariUcretIstisnasi, besPuanIndirimi }`

TypeScript tip tanımları pakete dahildir; sıfır çalışma zamanı bağımlılığı vardır.

## 2026 parametreleri

| Kalem | Değer |
|---|---|
| Brüt asgari ücret | 33.030,00 ₺ |
| Net asgari ücret | 28.075,50 ₺ |
| SGK primi işçi payı | %14 |
| İşsizlik sigortası işçi payı | %1 |
| SGK primi işveren payı | %20,75 *(5 puan indirimli: %15,75)* |
| İşsizlik sigortası işveren payı | %2 |
| SGK tavanı | 297.270,00 ₺ |
| Damga vergisi | binde 7,59 |
| Gelir vergisi dilimleri | 190.000 → %15 · 400.000 → %20 · 1.500.000 → %27 · 5.300.000 → %35 · üzeri %40 |

Parametreler `src/veri/2026.ts` içinde, kaynaklarıyla birlikte tek yerde durur.
Yeni yıl eklemek için o dosyanın bir kopyasını çıkarıp `YILLAR` kaydına eklemek yeterlidir.

## Doğruluk

Bir maaş hesaplayıcısında en büyük risk, sessizce yanlış sayı üretmesidir. Buna karşı
**testler resmî olarak bilinen sonuçlara sabitlenmiştir**: asgari ücretlinin neti tam
`28.075,50 ₺` çıkmazsa CI kırmızı yanar. Parametrelerden herhangi biri yanlış girilirse
bu test onu yakalar.

```bash
npm run dogrula   # tip kontrolü + testler
```

Şu an 40 test çalışıyor: dilim geçişleri, SGK taban/tavan sınırları, netten brüte
tutarlılığı, istisna mantığı ve hatalı girdiler.

### Bilinen bir incelik

Asgari ücret istisnası, asgari ücretlinin **kendi birikimli matrahına** göre hesaplanır.
Asgari ücretlinin yıllık matrahı da (12 × 28.075,50 = 336.906 ₺) ilk dilimi aştığı için
istisna tutarı yıl içinde büyür. Bu yüzden yüksek maaşlı bir çalışanın neti, o ayda
**hafifçe artabilir**. Hata değil, mevzuatın doğal sonucudur; `test/kumulatif.test.ts`
içinde açıkça test edilir.

## Kapsam dışı

Engellilik indirimi, BES kesintisi, özel sigorta primleri, ikramiye ve yan haklar,
SGDP'li (emekli) çalışanlar, asgari geçim indirimi (2022'de kaldırıldı).

## Kaynaklar

- [Vergi Merkezi — 2026 Pratik Bilgiler](https://vergimerkezi.com.tr/2026-pratik-bilgiler-mali-rehber/)
- [Kolay İK — 2026 gelir vergisi dilimleri](https://kolayik.com/blog/2026-gelir-vergisi-dilimleri-guncel-tablo)
- [Kolay İK — 2026 bordro parametreleri](https://kolayik.com/blog/2026-bordro-parametreleri)
- [CottGroup — 2026 yılı bordrodaki yasal kesintiler](https://www.cottgroup.com/tr/mevzuat/item/2026-yili-icin-bordrodaki-yasal-kesintiler)

## Sorumluluk reddi

Bu paket bilgi amaçlıdır ve resmî bordro yerine geçmez. Hesaplamalar açık kaynak kodludur
ve testlerle doğrulanır; yine de kesin tutarlar için muhasebecinize danışın.

## Lisans

[MIT](LICENSE)
