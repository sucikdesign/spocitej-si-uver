/**
 * Povinné informace a právní stránky.
 *
 * Zdroje:
 *  – „Manuál pro poradce k webovým stránkám“ (SAB servis, Compliance 2022) – povinné sdělení
 *    o vázaném zástupci, odkaz na právní informace SAB servis, GDPR SAB servis, kalkulačky;
 *  – https://imperialvision.cz (identifikace provozovatele) a https://imperialvision.cz/gdpr/
 *    (informace o zpracování osobních údajů – správcem je SAB servis s.r.o.).
 * Nic z toho si web nevymýšlí; chybějící údaje jsou viditelně označené „[Doplnit…]“.
 */
import type { ReactNode } from "react";
import { SITE } from "../config/site";
import { openCookieSettings } from "../lib/consent";

export function Missing({ label }: { label: string }) {
  return (
    <span className="missing" title="Chybějící podklad – doplnit před spuštěním">
      [Doplnit: {label}]
    </span>
  );
}

function Ext({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children ?? href.replace(/^https?:\/\//, "")}
    </a>
  );
}

/** Seznam poradců (manuál kap. 1 – „Spolupracující poradci“). */
export function AdvisorsList() {
  const { advisors } = SITE.operator;
  return advisors.length ? <>{advisors.join(", ")}</> : <Missing label="celá jména finančních poradců, kteří na webu nabízejí služby" />;
}

/** Povinné sdělení o spolupráci se SAB servis (manuál kap. 1 – text s doplněnými údaji). */
export function TiedAgentStatement() {
  const { operator: o, principal: p } = SITE;
  return (
    <>
      Finanční služby zde propagované a nabízené poskytujeme jako společnost {o.companyName}, IČO: {o.ico}, se sídlem{" "}
      {o.registeredOffice}, a to v roli vázaného
      zástupce pro samostatného zprostředkovatele {p.name}, IČ: {p.ico}, se sídlem Jungmannova 748/30, 110 00 Praha 1,
      v následujících finančních oblastech: {o.financialAreas.join(", ").replace(/\.$/, "")}. Naše oprávnění je možné ověřit v Seznamu
      regulovaných a registrovaných subjektů finančního trhu České národní banky na{" "}
      <Ext href="http://www.cnb.cz/cnb/jerrs">www.cnb.cz/cnb/jerrs</Ext>, kde také najdete aktuální informace a
      podrobnosti o naší registraci a rozsahu našeho oprávnění.
    </>
  );
}

/** Odkaz na právní informace SAB servis (manuál kap. 1 – „Právní informace“). */
export function LegalInfoStatement() {
  return (
    <>
      Detailní právní informace k nabízeným službám a produktům (včetně reklamačního řádu, možnosti podání stížnosti,
      řešení sporů, orgánu dohledu, udržitelnosti atd.) najdete na <Ext href={SITE.principal.legalInfoUrl} />.
    </>
  );
}

/** Právní poučení ke kalkulačce (manuál kap. 7). */
export const CALCULATOR_NOTICE =
  "Vzhledem k tomu, že tato kalkulačka nezahrnuje všechny individuální parametry klienta, je potřeba výpočet brát pouze jako orientační a nezávazný. Pro přesné výpočty a konkrétní produktové nabídky nás neváhejte kontaktovat.";

/* ------------------------------------------------------------------------ */

function PrivacyPage() {
  const p = SITE.principal;
  return (
    <>
      <p>
        Osobní údaje, které nám poskytnete prostřednictvím kontaktního formuláře na tomto webu, zpracovává jako správce
        společnost {p.name}, pro kterou {SITE.operator.companyName} působí jako vázaný zástupce. Aktuální znění informací
        o zpracování osobních údajů najdete také na <Ext href={p.gdprUrl} />.
      </p>

      <h2 className="legal__h">Informace dle Nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR)</h2>
      <ol className="legal__list">
        <li>
          <strong>Totožnost a kontaktní údaje správce:</strong> SAB servis, s.r.o., se sídlem Praha 1 – Nové Město,
          Jungmannova 748/30, PSČ 110 00, IČO: {p.ico}, {p.commercialRegister}.
          <br />
          <strong>Pověřenec pro ochranu osobních údajů:</strong> {p.dpo}.
        </li>
        <li>
          <strong>Účely zpracování osobních údajů:</strong>
          <ol type="a" className="legal__sublist">
            <li>poskytování služeb spočívajících ve zprostředkování uzavírání smluv, zejména zprostředkování pojištění, poskytování investičních služeb, zprostředkování spotřebitelských úvěrů;</li>
            <li>plnění zákonných povinností správce jako investičního zprostředkovatele, samostatného zprostředkovatele a samostatného zprostředkovatele spotřebitelského úvěru vyplývajících ze zvláštních předpisů (např. zákona č. 170/2018 Sb., zákona č. 256/2004 Sb., zákona č. 257/2016 Sb., zákona č. 253/2008 Sb.);</li>
            <li>ukládání a uchovávání osobních údajů v databázi klientů (zákazníků) správce a současné předávání a sdílení osobních údajů s příjemci uvedenými pod bodem 4;</li>
            <li>vnitřní potřeby, zejména ochrana práv a právem chráněných zájmů správce, sledování kvality služeb a spokojenosti klientů a optimalizace poskytovaných služeb a produktů;</li>
            <li>obchodní a (tele)marketingové, zejména nabízení služeb včetně zasílání obchodních sdělení, informování o produktech a službách, a to včetně cílených nabídek produktů a služeb založených na automatizovaném zpracování osobních údajů, vč. profilování.</li>
          </ol>
        </li>
        <li>
          <strong>Právní základy zpracování:</strong> souhlas subjektu údajů, plnění zákonných (právních) povinností
          správce (zejm. dle bodu 2. b).
        </li>
        <li>
          <strong>Kategorie příjemců osobních údajů:</strong> osoby fyzické či právnické tvořící se správcem koncern
          a třetí osoby spolupracující se správcem; smluvní partneři správce, tj. zejména vázaní zástupci správce
          (zde {SITE.operator.companyName}); obchodní partneři správce, tj. osoby, které zastupuje správce při uzavírání
          smluv se subjektem údajů, zejména banky, pojišťovny, investiční společnosti a fondy, penzijní společnosti,
          poskytovatelé spotřebitelských úvěrů, zdravotní pojišťovny, družstevní záložny; orgány veřejné moci při plnění
          zákonných povinností správce, např. Česká národní banka, Ministerstvo financí České republiky, Finanční
          analytický úřad.
        </li>
        <li>
          <strong>Doba uložení:</strong> po dobu využívání služeb správce, vždy však do odvolání souhlasu se zpracováním,
          v případě údajů potřebných pro plnění zákonných povinností správce po dobu stanovenou příslušnými právními
          předpisy.
        </li>
        <li>
          <strong>Vaše práva:</strong> máte právo požadovat přístup ke svým osobním údajům, jejich opravu nebo výmaz,
          popř. omezení zpracování; vznést námitku proti zpracování; na přenositelnost údajů; kdykoli odvolat souhlas se
          zpracováním, aniž je tím dotčena zákonnost zpracování před jeho odvoláním; podat stížnost u dozorového úřadu,
          kterým je Úřad pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7, <Ext href="https://www.uoou.cz" />.
        </li>
        <li>
          Poskytnutí osobních údajů je (smluvním) předpokladem toho, abychom vám mohli poskytnout poradenské či další
          služby v plném rozsahu; bez jejich poskytnutí může dojít k omezení rozsahu služeb.
        </li>
      </ol>

      <h2 className="legal__h">Jaké údaje sbírá tento web</h2>
      <ul className="legal__list legal__list--disc">
        <li>
          <strong>Kontaktní formulář:</strong> jméno a příjmení, e-mail a/nebo telefon, preferovaný způsob kontaktu,
          text zprávy a – pokud to ve formuláři zvolíte – výsledek orientačního výpočtu z kalkulačky. Údaje slouží
          k tomu, abychom vás mohli kontaktovat a probrat vaše možnosti. Formulář odešlete jen se souhlasem se
          zpracováním osobních údajů.
        </li>
        <li>
          <strong>Kalkulačka</strong> počítá přímo ve vašem prohlížeči. Zadané hodnoty se nikam neodesílají, dokud je
          sami nepřiložíte k odeslanému formuláři.
        </li>
        <li>
          <strong>Technické údaje a cookies</strong> – viz <a href="#/cookies">Zásady používání cookies</a>.
        </li>
      </ul>
    </>
  );
}

function CookiesPage() {
  return (
    <>
      <p>
        Cookies a podobné technologie (např. úložiště prohlížeče localStorage) jsou malé soubory, které si web ukládá
        ve vašem zařízení. Nezbytné technologie potřebuje web ke svému fungování; ostatní používáme jen s vaším
        souhlasem. Souhlas můžete kdykoli změnit nebo odvolat tlačítkem níže nebo odkazem „Nastavení cookies“ v patičce.
      </p>

      <h2 className="legal__h">Co web používá</h2>
      <div className="legal__table-wrap">
        <table className="legal__table">
          <thead>
            <tr><th scope="col">Název</th><th scope="col">Poskytovatel</th><th scope="col">Účel</th><th scope="col">Typ / doba</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>iv_cookie_consent</td>
              <td>tento web</td>
              <td>uložení vaší volby v nastavení cookies</td>
              <td>nezbytné, localStorage, do změny volby</td>
            </tr>
            <tr>
              <td>msgsndr_id</td>
              <td>LeadConnector (platforma GoHighLevel, na které web běží)</td>
              <td>identifikace návštěvy a přiřazení zdroje, ze kterého přišla poptávka</td>
              <td>cookie, doba dle nastavení platformy</td>
            </tr>
            <tr>
              <td>v2_history_*, v2_session_history_*, v3_first_session_event_*, v2_contact_session_*</td>
              <td>LeadConnector (GoHighLevel)</td>
              <td>historie návštěvy a relace pro přiřazení zdroje poptávky</td>
              <td>localStorage, doba dle nastavení platformy</td>
            </tr>
            <tr>
              <td>Cloudflare Web Analytics</td>
              <td>Cloudflare, Inc.</td>
              <td>anonymní měření návštěvnosti a výkonu webu (bez cookies)</td>
              <td>bez ukládání do zařízení</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Analytické ani marketingové nástroje třetích stran (např. Google Analytics, Meta Pixel) web v současnosti
        nepoužívá. Pokud je v budoucnu nasadíme, doplníme je do tohoto přehledu a spustí se až po vašem souhlasu.
      </p>
      <p>
        Soubory webu (písmo, obrázky, video, skripty) se načítají ze služby GitHub Pages (GitHub, Inc.). Při jejich
        načtení se k poskytovateli přenáší technické údaje vašeho připojení (např. IP adresa), cookies se však
        neukládají.
      </p>
      <button type="button" className="btn btn--primary" onClick={openCookieSettings}>
        Otevřít nastavení cookies
      </button>
    </>
  );
}

function LegalInfoPage() {
  const { operator: o, contact: c } = SITE;
  return (
    <>
      <h2 className="legal__h">Provozovatel webu</h2>
      <p>
        {o.companyName}, IČO: {o.ico}, se sídlem {o.registeredOffice}. {o.commercialRegister}.
        <br />
        Telefon: <a href={`tel:${c.phone?.replace(/\s/g, "")}`}>{c.phone}</a> · e-mail:{" "}
        <a href={`mailto:${c.email}`}>{c.email}</a>
      </p>

      <h2 className="legal__h">Informace o spolupráci se SAB servis</h2>
      <p><TiedAgentStatement /></p>

      <h2 className="legal__h">Právní informace, stížnosti a řešení sporů</h2>
      <p><LegalInfoStatement /></p>

      <h2 className="legal__h">Kalkulačka</h2>
      <p>
        {CALCULATOR_NOTICE} Výpočet předpokládá neměnnou úrokovou sazbu po celou dobu splácení a nezahrnuje poplatky
        spojené s refinancováním, pojištění ani vedení účtu. Sazba v kalkulačce je pouze modelová, kterou si můžete
        libovolně změnit, a není nabídkou žádné banky ani jiného poskytovatele úvěru.
      </p>
    </>
  );
}

export const LEGAL_PAGES: Record<string, { title: string; body: () => ReactNode }> = {
  "ochrana-osobnich-udaju": { title: "Ochrana osobních údajů", body: PrivacyPage },
  cookies: { title: "Zásady používání cookies", body: CookiesPage },
  "pravni-informace": { title: "Právní informace", body: LegalInfoPage },
};
