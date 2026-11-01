/**
 * Centrální konfigurace webu – kontakty, právní údaje a integrace.
 *
 * ⚠️ Hodnoty `null` jsou CHYBĚJÍCÍ PODKLADY. Web je zobrazuje jako viditelně
 * označené placeholdery („Doplnit…“) a nikdy si je nevymýšlí.
 * Před spuštěním je doplňte podle podkladů od Imperial Vision.
 */

export interface SiteConfig {
  name: string;
  brand: string;
  /** Kanonická URL webu, např. "https://spocitejsiuver.cz" – chybí. */
  url: string | null;
  contact: {
    phone: string | null;
    email: string | null;
    address: string | null;
    /** Odkaz na hlavní web Imperial Vision. */
    mainWebsite: string | null;
  };
  operator: {
    companyName: string | null;
    ico: string | null;
    dic: string | null;
    registeredOffice: string | null;
    /** Zápis v obchodním rejstříku (soud, oddíl, vložka). */
    commercialRegister: string | null;
    /** Regulační postavení dle zák. č. 257/2016 Sb. a registrace v ČNB. */
    regulatoryStatus: string | null;
    cnbRegistryUrl: string | null;
    /** Případný zastoupený samostatný zprostředkovatel. */
    representedBy: string | null;
    /** Orgán dohledu / mimosoudní řešení sporů (např. finanční arbitr). */
    disputeResolution: string | null;
    /** Finanční poradci, kteří na tomto webu nabízejí služby (celé jméno a příjmení). */
    advisors: string[];
    /** Finanční oblasti, ve kterých zde služby nabízíme (pro sdělení o vázaném zástupci). */
    financialAreas: string[];
  };
  /** Zastoupený samostatný zprostředkovatel a správce osobních údajů (dle manuálu SAB servis). */
  principal: {
    name: string;
    ico: string;
    address: string;
    commercialRegister: string;
    legalInfoUrl: string;
    gdprUrl: string;
    dpo: string;
  };
  integrations: {
    /**
     * Endpoint pro odeslání poptávky (POST JSON). `null` = formulář pravdivě
     * hlásí, že odesílání není napojeno. Viz README → „Kontaktní formulář“.
     */
    leadEndpoint: string | null;
    /** URL profilu Google Business (odkaz „Všechny recenze na Google“). */
    googleReviewsUrl: string | null;
  };
}

export const SITE: SiteConfig = {
  name: "Spočítej si úvěr",
  brand: "Imperial Vision",
  url: null,
  // Údaje převzaty z patičky https://imperialvision.cz (31. 10. 2026)
  contact: {
    phone: "+420 733 433 020",
    email: "info@imperialvision.cz",
    address: "nám. T. G. Masaryka 2433, 760 01 Zlín",
    mainWebsite: "https://imperialvision.cz",
  },
  operator: {
    companyName: "Imperial Vision s.r.o.",
    ico: "05173841",
    dic: null, // na imperialvision.cz neuvedeno
    registeredOffice: "nám. T. G. Masaryka 2433, 760 01 Zlín",
    commercialRegister: "Spisová značka C 93943 vedená u Krajského soudu v Brně",
    regulatoryStatus: null,
    cnbRegistryUrl: null,
    representedBy: null,
    disputeResolution: null,
    // TODO: doplnit seznam poradců (manuál SAB servis, kap. 1 – „Spolupracující poradci“)
    advisors: [],
    financialAreas: ["spotřebitelské úvěry dle zákona č. 257/2016 Sb."],
  },
  // Údaje převzaty z manuálu SAB servis („Manuál pro poradce k webovým stránkám“, 2022)
  // a z https://imperialvision.cz/gdpr/ (1. 11. 2026)
  principal: {
    name: "SAB servis s.r.o.",
    ico: "24704008",
    address: "Jungmannova 748/30, 110 00 Praha 1 – Nové Město",
    commercialRegister: "zapsaná v obchodním rejstříku u Městského soudu v Praze, oddíl C, vložka 167427",
    legalInfoUrl: "https://sabservis.cz/informace",
    gdprUrl: "https://sabservis.cz/gdpr",
    dpo: "Miroslav Švenda, Jánský vršek 323/13, 118 00 Praha 1 – Malá Strana, e-mail: svenda@sabservis.cz, tel.: +420 257 223 191",
  },
  integrations: {
    leadEndpoint: null,
    googleReviewsUrl: null,
  },
};
