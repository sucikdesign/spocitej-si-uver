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
  },
  integrations: {
    leadEndpoint: null,
    googleReviewsUrl: null,
  },
};
