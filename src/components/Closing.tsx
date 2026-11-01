import { useEffect, useRef, useState } from "react";
import { CoBrandLogo } from "./Brand";
import { attachHoverPlayback, gradientVideoSources } from "../lib/hoverVideo";
import { ContactForm } from "./ContactForm";
import type { CalculationSummary } from "./Calculator";
import { SITE } from "../config/site";
import { openCookieSettings } from "../lib/consent";

/* ------------------------------------------------------------------------ */
/* Závěrečné CTA + kontaktní formulář                                       */
/* ------------------------------------------------------------------------ */

/**
 * Gradientové video na pozadí závěrečné sekce – stejný soubor jako v hero.
 * Ve výchozím stavu stojí na prvním snímku, přehrává se jen při najetí myší.
 */
function FinalVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [sources] = useState(gradientVideoSources);
  useEffect(() => {
    const video = ref.current;
    const area = video?.closest<HTMLElement>(".final");
    if (!video || !area) return;
    return attachHoverPlayback(video, area).dispose;
  }, []);
  return (
    <div className="final__media" aria-hidden="true">
      <video
        ref={ref}
        className="final__video"
        poster="/assets/video/hero-first.webp"
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
        disablePictureInPicture
      >
        <source src={sources.mp4} type="video/mp4" />
        <source src={sources.webm} type="video/webm" />
      </video>
    </div>
  );
}

export function FinalCta({ summary }: { summary: CalculationSummary | null }) {
  return (
    <section id="kontakt" className="final" aria-labelledby="final-title" tabIndex={-1}>
      <FinalVideo />
      <div className="iv-container">
        <div className="final__card" data-reveal>
          <div className="final__copy">
            <h2 id="final-title" className="h2 h2--inverse">Konzultace vás nic nestojí.</h2>
            <p className="final__lead">Platí nás banky. Vy nám za naše služby nic neplatíte.</p>
            <p className="final__text">
              Nebojte se nám ozvat a zjistit, jaké možnosti máte. Jde nám vždy o to najít řešení, které dává smysl.
            </p>
            <p className="final__text">
              Projdeme vaši situaci a potřeby, porovnáme aktuální možnosti na trhu a zjistíme, jestli a jak vám
              dokážeme pomoci.
            </p>
          </div>
          <div className="final__form">
            <ContactForm summary={summary} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Patička                                                                  */
/* ------------------------------------------------------------------------ */

function Missing({ label }: { label: string }) {
  return (
    <span className="missing" title="Chybějící podklad – doplnit před spuštěním">
      [Doplnit: {label}]
    </span>
  );
}

export const LEGAL_LINKS = [
  { href: "#/ochrana-osobnich-udaju", label: "Ochrana osobních údajů" },
  { href: "#/cookies", label: "Zásady používání cookies" },
  { href: "#/pravni-informace", label: "Právní informace" },
];

export function Footer() {
  const { contact, operator } = SITE;
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="iv-container footer__grid">
        <div className="footer__brand">
          <CoBrandLogo />
          <p className="footer__claim">Orientační kalkulačka refinancování úvěrů a hypoték.</p>
        </div>

        <nav className="footer__col" aria-label="Navigace v patičce">
          <h2 className="footer__h">Web</h2>
          <ul>
            <li><a href="#kalkulacka">Kalkulačka</a></li>
            <li><a href="#refinancovani">Jak to funguje</a></li>
            <li><a href="#recenze">Recenze</a></li>
            <li><a href="#kontakt">Konzultace</a></li>
          </ul>
        </nav>

        <div className="footer__col">
          <h2 className="footer__h">Kontakt</h2>
          <ul>
            <li>{contact.phone ? <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a> : <Missing label="telefon" />}</li>
            <li>{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : <Missing label="e-mail" />}</li>
            <li>{contact.address ?? <Missing label="adresa" />}</li>
            {contact.mainWebsite && (
              <li><a href={contact.mainWebsite} rel="noopener">Hlavní web Imperial Vision</a></li>
            )}
          </ul>
        </div>

        <nav className="footer__col" aria-label="Právní informace">
          <h2 className="footer__h">Právní informace</h2>
          <ul>
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}><a href={l.href}>{l.label}</a></li>
            ))}
            <li>
              <button type="button" className="footer__linkbtn" onClick={openCookieSettings}>
                Nastavení cookies
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <div className="iv-container footer__operator">
        <h2 className="footer__h">Provozovatel</h2>
        <p>
          {operator.companyName ?? <Missing label="obchodní firma" />}, IČO {operator.ico ?? <Missing label="IČO" />}
          {operator.dic && <>, DIČ {operator.dic}</>}, se sídlem {operator.registeredOffice ?? <Missing label="sídlo" />}.{" "}
          {operator.commercialRegister ?? <Missing label="zápis v obchodním rejstříku" />}.
        </p>
        <p>
          {operator.regulatoryStatus ?? <Missing label="regulační postavení a registrace v ČNB (zák. č. 257/2016 Sb.)" />}
          {operator.cnbRegistryUrl && (
            <> · <a href={operator.cnbRegistryUrl} target="_blank" rel="noopener noreferrer">Ověřit v registru ČNB</a></>
          )}
          {operator.representedBy && <> · {operator.representedBy}</>}
        </p>
        <p>{operator.disputeResolution ?? <Missing label="mimosoudní řešení sporů / orgán dohledu" />}</p>
        <p className="footer__fine">
          Výsledky kalkulačky jsou orientační a nepředstavují nabídku ani doporučení konkrétního úvěrového produktu.
        </p>
      </div>

      <div className="iv-container footer__bottom">
        <span>© {year} Imperial Vision</span>
        <a href="#top">Zpět nahoru ↑</a>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------------ */
/* Právní stránky (obsah dodá Imperial Vision / právník)                    */
/* ------------------------------------------------------------------------ */

const LEGAL_PAGES: Record<string, { title: string; intro: string; outline: string[] }> = {
  "ochrana-osobnich-udaju": {
    title: "Ochrana osobních údajů",
    intro: "Text zásad zpracování osobních údajů dodá Imperial Vision. Níže je pouze osnova požadovaného obsahu dle GDPR.",
    outline: [
      "Správce osobních údajů a jeho kontaktní údaje (případně pověřenec)",
      "Rozsah zpracovávaných údajů z kontaktního formuláře a kalkulačky",
      "Účely a právní základy zpracování",
      "Doba uložení",
      "Příjemci a zpracovatelé (hosting, CRM, e-mailing)",
      "Předávání do třetích zemí",
      "Práva subjektu údajů a právo podat stížnost u ÚOOÚ",
    ],
  },
  cookies: {
    title: "Zásady používání cookies",
    intro: "Text zásad cookies dodá Imperial Vision. Seznam cookies doplňte podle skutečně nasazených nástrojů.",
    outline: [
      "Nezbytné: iv_cookie_consent (localStorage) – uložení volby souhlasu, 12 měsíců / do změny",
      "Analytické: zatím nejsou nasazeny – doplnit při nasazení (název, poskytovatel, účel, doba)",
      "Marketingové: zatím nejsou nasazeny – doplnit při nasazení",
      "Jak souhlas změnit nebo odvolat",
    ],
  },
  "pravni-informace": {
    title: "Právní informace",
    intro: "Identifikační a regulační údaje provozovatele dodá Imperial Vision.",
    outline: [
      "Obchodní firma, IČO, DIČ, sídlo, zápis v obchodním rejstříku",
      "Postavení zprostředkovatele a číslo registrace v ČNB (zák. č. 257/2016 Sb.)",
      "Zastoupený samostatný zprostředkovatel (je-li relevantní)",
      "Orgán dohledu a mimosoudní řešení sporů (finanční arbitr)",
      "Informace o odměně zprostředkovatele",
      "Upozornění k orientační povaze výpočtů",
    ],
  },
};

export function LegalPage({ slug }: { slug: string }) {
  const page = LEGAL_PAGES[slug];
  if (!page) {
    return (
      <main id="main" className="legal iv-container" tabIndex={-1}>
        <h1 className="h2">Stránka nenalezena</h1>
        <p><a className="link" href="#top">Zpět na úvod</a></p>
      </main>
    );
  }
  return (
    <main id="main" className="legal" tabIndex={-1}>
      <div className="iv-container iv-container--narrow">
        <a className="link" href="#top">← Zpět na kalkulačku</a>
        <h1 className="h2 legal__title">{page.title}</h1>
        <p className="placeholder-note" role="note">
          Dočasná stránka – finální právní text zatím nebyl dodán. Tento obsah není platným právním dokumentem.
        </p>
        <p>{page.intro}</p>
        <ul className="legal__outline">
          {page.outline.map((o) => <li key={o}>{o}</li>)}
        </ul>
        {slug === "cookies" && (
          <button type="button" className="btn btn--primary" onClick={openCookieSettings}>
            Otevřít nastavení cookies
          </button>
        )}
      </div>
    </main>
  );
}
