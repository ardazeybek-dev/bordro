# bordro

[![CI](https://github.com/ardazeybek-dev/bordro/actions/workflows/ci.yml/badge.svg)](https://github.com/ardazeybek-dev/bordro/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Turkish payroll calculator. Gross to net, net to gross, employer cost — and the
thing almost every online calculator gets wrong: **cumulative income tax across 12 months.**

**[Try it in your browser →](https://ardazeybek-dev.github.io/bordro/)**

Run it without installing anything:

```bash
npx bordro 75000
```

Add it to your project:

```bash
npm install bordro
```

> **Note on language:** the documentation, the code comments and the test names are in English.
> The API names, the CLI output and the web page stay in Turkish on purpose — the domain is
> Turkish tax law, its vocabulary has no clean English equivalent, and the people who need a
> `bordro` are reading their payslip in Turkish. Renaming the API would also break every
> installed copy for no benefit.

## Why another salary calculator?

In Turkey, income tax is calculated **cumulatively** from the start of the year. Even
if your gross salary never changes, your take-home pay drops in the month your
cumulative tax base crosses into a higher bracket:

```
Gross 75,000 TRY — 2026, no raise at any point

January     58,080.28 TRY   15%
March       58,017.78 TRY   20%  ← moved up a bracket
April       54,892.77 TRY   20%
July        51,981.70 TRY   27%  ← moved up again
December    51,834.05 TRY   27%

January → December difference: −6,246.23 TRY
```

Calculators that compute a single month never show this drop. `bordro` computes all
twelve months and marks exactly when the bracket changes.

## Usage

### Library

```js
import { hesapla, yillikHesapla, nettenBrute, isvereneMaliyet } from "bordro";
// install: npm install bordro

// One month (defaults to January)
hesapla(75000).net;              // 58080.28
hesapla(75000, 7).net;           // 51981.70  — July, higher bracket

// Full year
const year = yillikHesapla(75000);
year.toplam.net;                 // 650008.62  — annual net
year.dilimGecisAylari;           // [3, 7]     — months where the bracket changed
year.netDegisimi;                // -6246.23   — December net minus January net

// Net to gross
nettenBrute(50000);              // 63697.48

// Employer cost
isvereneMaliyet(75000).toplamMaliyet;                            // 92062.50
isvereneMaliyet(75000, { besPuanIndirimi: true }).toplamMaliyet; // 88312.50
```

### Command line

No installation needed — `npx` runs it straight from GitHub:

```bash
npx bordro 75000            # gross to net, 12-month table
npx bordro --net 50000      # net to gross
npx bordro 75000 --isveren  # employer cost
npx bordro 120000 --ay 7    # a single month (July)
npx bordro 75000 --json     # JSON output
```

Once installed, the command is simply `bordro`:

```bash
bordro 75000 --isveren
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

| Function | Returns |
|---|---|
| `hesapla(gross, month?, options?)` | Full payroll breakdown for that month (`AylikBordro`) |
| `yillikHesapla(gross, options?)` | All 12 months plus annual totals (`YillikSonuc`) |
| `brutenNete(gross, month?, options?)` | Net amount only |
| `nettenBrute(net, month?, options?)` | Gross salary that yields the given net |
| `isvereneMaliyet(gross, options?)` | Employer contributions and total cost |
| `yilParametreleri(year?)` | Statutory parameters for that year |

**Options:** `{ yil, asgariUcretIstisnasi, besPuanIndirimi }` — year, minimum-wage tax
exemption (on by default), and the 5-point employer contribution discount (off by default).

TypeScript definitions are included and there are no runtime dependencies.

## 2026 parameters

| Item | Value |
|---|---|
| Gross minimum wage | 33,030.00 TRY |
| Net minimum wage | 28,075.50 TRY |
| Social security, employee share | 14% |
| Unemployment insurance, employee share | 1% |
| Social security, employer share | 20.75% *(with 5-point discount: 15.75%)* |
| Unemployment insurance, employer share | 2% |
| Social security ceiling | 297,270.00 TRY |
| Stamp tax | 0.759% |
| Income tax brackets | 190,000 → 15% · 400,000 → 20% · 1,500,000 → 27% · 5,300,000 → 35% · above → 40% |

All parameters live in `src/veri/2026.ts` together with their sources. Supporting a new
year means copying that file and registering it in the `YILLAR` map.

## Correctness

The biggest risk in a payroll calculator is producing a wrong number silently. To guard
against that, **the tests are pinned to officially published figures**: if the net minimum
wage does not come out to exactly `28,075.50 TRY`, CI fails. Any mistyped parameter is
caught there.

```bash
npm run verify    # type-check + tests
```

There are currently 40 tests covering bracket transitions, social security floor and
ceiling, net-to-gross round-tripping, exemption logic and invalid input.

### A subtle detail

The minimum-wage exemption is computed from the **minimum-wage earner's own cumulative
tax base**. Since that base also exceeds the first bracket over a year
(12 × 28,075.50 = 336,906 TRY), the exemption itself grows mid-year — which means a
higher earner's net pay can tick **slightly upward** in that month. This is not a bug but
a consequence of the legislation, and it is tested explicitly in `test/kumulatif.test.ts`.

## Out of scope

Disability tax relief, private pension deductions, private insurance premiums, bonuses
and fringe benefits, employees working under retirement social security status (SGDP),
and the minimum living allowance (abolished in 2022).

## Sources

- [Vergi Merkezi — 2026 quick reference](https://vergimerkezi.com.tr/2026-pratik-bilgiler-mali-rehber/)
- [Kolay İK — 2026 income tax brackets](https://kolayik.com/blog/2026-gelir-vergisi-dilimleri-guncel-tablo)
- [Kolay İK — 2026 payroll parameters](https://kolayik.com/blog/2026-bordro-parametreleri)
- [CottGroup — statutory payroll deductions for 2026](https://www.cottgroup.com/tr/mevzuat/item/2026-yili-icin-bordrodaki-yasal-kesintiler)

## Disclaimer

This package is provided for informational purposes and is not a substitute for an
official payroll statement. The calculations are open source and covered by tests, but
please consult your accountant for binding figures.

## License

[MIT](LICENSE)
