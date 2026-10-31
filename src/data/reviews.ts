/**
 * Google recenze – Imperial Vision s.r.o. (nám. T. G. Masaryka 2433, Zlín).
 *
 * Skutečné recenze převzaté z veřejného profilu na Mapách Google dne 31. 10. 2026
 * (originální znění v češtině, beze změn). Bez přihlášení Google zobrazuje jen
 * 5 z celkem 17 recenzí – zbývající doplňte z Google Business Profile nebo
 * napojením na Google Places API (viz README → „Recenze“).
 *
 * Datum je relativní údaj tak, jak ho Google zobrazoval v den převzetí.
 * Recenze nikdy neupravujte ani nevymýšlejte.
 */

export interface Review {
  author: string;
  /** Hodnocení 1–5; null, pokud není k dispozici. */
  rating: number | null;
  text: string;
  /** ISO datum (YYYY-MM-DD), je-li známé. */
  date: string | null;
  /** Relativní datum z Google (např. „před 2 měsíci“) ke dni převzetí. */
  relativeDate?: string;
  url?: string;
  source: "google";
  placeholder?: boolean;
}

export interface ReviewSummary {
  /** Průměrné hodnocení z Google – jen ze skutečných dat. */
  average: number;
  count: number;
  /** Den, ke kterému byl souhrn ověřen. */
  checkedAt: string;
}

/** Profil firmy na Mapách Google (CID 0x3b8a91490547ec1b). */
export const GOOGLE_PROFILE_URL = "https://maps.google.com/?cid=4290401337831058459";

export const reviews: Review[] = [
  {
    author: "Michaela K",
    rating: 5,
    relativeDate: "před 2 měsíci",
    date: null,
    source: "google",
    text:
      "Se službami Imperial Vision jsme nemohli být spokojenější! Profesionalita, flexibilita, rychlé jednání a naprosto skvělý přístup. Sjednávali jsme hypotéku a všechno šlo hladce díky paní Zollerové a panu Kolínkovi, kterým nevadilo nám cokoliv vysvětlit i víckrát, abych proces dobře pochopili a navíc nám zajistili skvělou úrokovou sazbu, se kterou jsme ani nepočítali! Moc doporučujeme a určitě se na Imperial Vision v budoucnu znovu obrátíme!",
  },
  {
    author: "Alex Part",
    rating: 5,
    relativeDate: "před 2 měsíci",
    date: null,
    source: "google",
    text:
      "S poskytnutými službami jsem byl velmi spokojený. Velká pochvala patří panu Krausovi za profesionální a ochotný přístup, rychlost vyřízení a bezproblémovou komunikaci. Vše proběhlo hladce a bez zbytečných komplikací. Určitě doporučuji.",
  },
  {
    author: "Marie Stefkovicova",
    rating: 5,
    relativeDate: "před měsícem",
    date: null,
    source: "google",
    text:
      "Vřele doporučuji Jiřího Kolínka s jeho týmem z Imperial Vision.\nSe vším ohledně pojistné události mi pomohli, i když jsme sjednali smlouvu již před lety. Jednají mile s ochotou, což v této době velmi oceňuji. Pojistná událost byla vyřízena velmi rychle k mému překvapení.\nZa mě bezkonkurenční kolektiv pracovníků s vynikajícím vedoucím. Tento kolektiv za jejich služby by měl být náležitě odměněn.\n\nTímto moc děkuji.\n\nS pozdravem\n\nMarie Štefkovičová",
  },
  {
    author: "Tereza Sucháčková",
    rating: 5,
    relativeDate: "před 5 měsíci",
    date: null,
    source: "google",
    text:
      "Pavel Kolaja, super člověk. Je to můj dlouholetý finanční poradce, na kterého se můžu ve všem spolehnout. Cokoliv potřebuju řešit nebo poradit, během krátké chvíle mi přijde několik možností a vždy vybereme tu nejlepší variantu. Za mě nejlepší finanční poradce🍀 můžu jenom doporučit.\nPavle, díky za vše👌🏼",
  },
  {
    author: "Tony Trubiroha",
    rating: 5,
    relativeDate: "před 3 týdny",
    date: null,
    source: "google",
    text: "Mohu jen doporučit, vstřícný přístup, srozumitelné vysvětlení, byl jsem spokojený",
  },
];

/** Souhrn z Google profilu ke dni 31. 10. 2026. */
export const reviewSummary: ReviewSummary | null = { average: 5.0, count: 17, checkedAt: "2026-10-31" };

/** Testovací ukázky se zobrazí jen tehdy, když je pole `reviews` prázdné. */
export const SHOW_REVIEW_PLACEHOLDERS = false;

export const placeholderReviews: Review[] = [1, 2, 3].map((i) => ({
  author: `Testovací autor ${i}`,
  rating: null,
  text: "Testovací text – zde se zobrazí skutečná recenze z Google profilu Imperial Vision.",
  date: null,
  source: "google",
  placeholder: true,
}));
