/** A single bracket of the income tax schedule. */
export interface VergiDilimi {
  /** Upper bound of the bracket (cumulative tax base, TRY). `Infinity` on the last one. */
  ustSinir: number;
  /** Rate applied to the bracket (0.15 = 15%). */
  oran: number;
}

/** Every statutory parameter for a given year. */
export interface YilParametreleri {
  yil: number;
  /** Monthly gross minimum wage (TRY). */
  asgariUcretBrut: number;
  /** Lower bound of social security earnings (TRY/month). */
  sgkTaban: number;
  /** Upper bound of social security earnings — the ceiling (TRY/month). */
  sgkTavan: number;
  /** Employee share of the social security premium. */
  sgkIsciOrani: number;
  /** Employee share of the unemployment insurance premium. */
  issizlikIsciOrani: number;
  /** Employer share of the social security premium (without the incentive). */
  sgkIsverenOrani: number;
  /** Employer social security rate when the 5-point discount applies. */
  sgkIsverenIndirimliOrani: number;
  /** Employer share of the unemployment insurance premium. */
  issizlikIsverenOrani: number;
  /** Stamp duty rate on wages (0.759 per cent = 0.00759). */
  damgaVergisiOrani: number;
  /** Income tax schedule applied to wage income, in ascending order. */
  gelirVergisiDilimleri: readonly VergiDilimi[];
  /** Sources the figures were taken from. */
  kaynaklar: readonly string[];
}

/** The payroll breakdown of a single month. */
export interface AylikBordro {
  /** Month number, 1 = January. */
  ay: number;
  brut: number;
  /** Social security base: the gross salary clamped between the floor and the ceiling. */
  sgkMatrahi: number;
  sgkIsci: number;
  issizlikIsci: number;
  /** Income tax base: gross minus the social security deductions. */
  gelirVergisiMatrahi: number;
  /** Total income tax base from the start of the year up to this month. */
  kumulatifMatrah: number;
  /** Income tax from the schedule, before the exemption is deducted. */
  hesaplananGelirVergisi: number;
  /** The minimum wage income tax exemption that gets deducted. */
  gelirVergisiIstisnasi: number;
  /** Income tax actually withheld. */
  gelirVergisi: number;
  hesaplananDamgaVergisi: number;
  damgaVergisiIstisnasi: number;
  damgaVergisi: number;
  /** Total deductions. */
  kesintiler: number;
  /** Net pay that reaches the employee. */
  net: number;
  /** Highest income tax rate applied in this month (0.15, 0.20 ...). */
  vergiDilimiOrani: number;
  /** True if this month moved up into a higher tax bracket. */
  dilimAtladi: boolean;
}

/** Employer cost breakdown (monthly). */
export interface IsverenMaliyeti {
  brut: number;
  sgkMatrahi: number;
  sgkIsveren: number;
  issizlikIsveren: number;
  /** Gross plus the employer premiums. */
  toplamMaliyet: number;
  /** Was the 5-point discount applied? */
  indirimUygulandi: boolean;
}

/** Result of the annual calculation. */
export interface YillikSonuc {
  yil: number;
  brut: number;
  aylar: AylikBordro[];
  /** Annual totals. */
  toplam: {
    brut: number;
    sgkIsci: number;
    issizlikIsci: number;
    gelirVergisi: number;
    damgaVergisi: number;
    kesintiler: number;
    net: number;
  };
  /** Months in which the tax bracket changed (1 = January). */
  dilimGecisAylari: number[];
  /** Difference between December net and January net (usually negative). */
  netDegisimi: number;
}

/** Calculation options. */
export interface HesapSecenekleri {
  /** Year to calculate. Defaults to the most recent supported year. */
  yil?: number;
  /**
   * Apply the minimum wage income/stamp duty exemption?
   * It has applied to every wage earner since 2022; defaults to `true`.
   */
  asgariUcretIstisnasi?: boolean;
  /** Apply the 5-point discount to the employer social security share? Defaults to `false`. */
  besPuanIndirimi?: boolean;
}
