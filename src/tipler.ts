/** Gelir vergisi tarifesindeki tek bir dilim. */
export interface VergiDilimi {
  /** Dilimin üst sınırı (kümülatif vergi matrahı, TL). Son dilimde `Infinity`. */
  ustSinir: number;
  /** Dilime uygulanan oran (0.15 = %15). */
  oran: number;
}

/** Bir yıla ait tüm yasal parametreler. */
export interface YilParametreleri {
  yil: number;
  /** Aylık brüt asgari ücret (TL). */
  asgariUcretBrut: number;
  /** SGK prime esas kazanç alt sınırı (TL/ay). */
  sgkTaban: number;
  /** SGK prime esas kazanç üst sınırı — tavan (TL/ay). */
  sgkTavan: number;
  /** SGK primi işçi payı oranı. */
  sgkIsciOrani: number;
  /** İşsizlik sigortası işçi payı oranı. */
  issizlikIsciOrani: number;
  /** SGK primi işveren payı oranı (teşviksiz). */
  sgkIsverenOrani: number;
  /** 5 puanlık indirim uygulandığında SGK işveren payı oranı. */
  sgkIsverenIndirimliOrani: number;
  /** İşsizlik sigortası işveren payı oranı. */
  issizlikIsverenOrani: number;
  /** Ücretlerde damga vergisi oranı (binde 7,59 = 0.00759). */
  damgaVergisiOrani: number;
  /** Ücret gelirlerine uygulanan gelir vergisi tarifesi, artan sırada. */
  gelirVergisiDilimleri: readonly VergiDilimi[];
  /** Rakamların alındığı kaynaklar. */
  kaynaklar: readonly string[];
}

/** Tek bir ayın bordro dökümü. */
export interface AylikBordro {
  /** Ay numarası, 1 = Ocak. */
  ay: number;
  brut: number;
  /** Prime esas kazanç: brüt maaşın taban/tavan arasına sıkıştırılmış hâli. */
  sgkMatrahi: number;
  sgkIsci: number;
  issizlikIsci: number;
  /** Gelir vergisi matrahı: brüt − SGK kesintileri. */
  gelirVergisiMatrahi: number;
  /** Yıl başından bu aya kadarki toplam gelir vergisi matrahı. */
  kumulatifMatrah: number;
  /** Tarifeye göre hesaplanan gelir vergisi (istisna düşülmeden). */
  hesaplananGelirVergisi: number;
  /** Asgari ücrete isabet eden ve düşülen gelir vergisi istisnası. */
  gelirVergisiIstisnasi: number;
  /** Fiilen kesilen gelir vergisi. */
  gelirVergisi: number;
  hesaplananDamgaVergisi: number;
  damgaVergisiIstisnasi: number;
  damgaVergisi: number;
  /** Toplam kesinti. */
  kesintiler: number;
  /** Ele geçen net ücret. */
  net: number;
  /** Bu ayda uygulanan en yüksek gelir vergisi oranı (0.15, 0.20 ...). */
  vergiDilimiOrani: number;
  /** Bu ayda bir üst vergi dilimine geçildiyse true. */
  dilimAtladi: boolean;
}

/** İşverene maliyet dökümü (aylık). */
export interface IsverenMaliyeti {
  brut: number;
  sgkMatrahi: number;
  sgkIsveren: number;
  issizlikIsveren: number;
  /** Brüt + işveren primleri. */
  toplamMaliyet: number;
  /** 5 puanlık indirim uygulandı mı? */
  indirimUygulandi: boolean;
}

/** Yıllık hesap sonucu. */
export interface YillikSonuc {
  yil: number;
  brut: number;
  aylar: AylikBordro[];
  /** Yıllık toplamlar. */
  toplam: {
    brut: number;
    sgkIsci: number;
    issizlikIsci: number;
    gelirVergisi: number;
    damgaVergisi: number;
    kesintiler: number;
    net: number;
  };
  /** Yıl içinde vergi diliminin atlandığı aylar (1 = Ocak). */
  dilimGecisAylari: number[];
  /** Ocak ayı neti ile Aralık ayı neti arasındaki fark (genelde negatif). */
  netDegisimi: number;
}

/** Hesaplama seçenekleri. */
export interface HesapSecenekleri {
  /** Hesaplanacak yıl. Varsayılan: desteklenen en güncel yıl. */
  yil?: number;
  /**
   * Asgari ücret gelir/damga vergisi istisnası uygulansın mı?
   * 2022'den beri tüm ücretlilere uygulanır; varsayılan `true`.
   */
  asgariUcretIstisnasi?: boolean;
  /** SGK işveren payında 5 puanlık indirim uygulansın mı? Varsayılan `false`. */
  besPuanIndirimi?: boolean;
}
