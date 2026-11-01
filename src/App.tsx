import { useCallback, useEffect, useState } from "react";
import { Calculator, type CalculationSummary } from "./components/Calculator";
import { Explainer, Header, Hero, PartnerMarquee, Reviews, scrollToId } from "./components/Sections";
import { FinalCta, Footer, LegalPage } from "./components/Closing";
import { CookieConsent } from "./components/CookieConsent";
import { initMotion } from "./lib/motion";

/** Jednoduché hash routování pro právní stránky (#/slug). Bez další závislosti. */
function useLegalRoute(): string | null {
  const read = () => (window.location.hash.startsWith("#/") ? window.location.hash.slice(2) : null);
  const [slug, setSlug] = useState<string | null>(read);
  useEffect(() => {
    const onHash = () => {
      const next = read();
      setSlug(next);
      if (next) window.scrollTo(0, 0);
      else if (window.location.hash.length > 1) {
        // návrat z právní stránky na kotvu (např. #kalkulacka) – po vykreslení dorolovat
        const id = window.location.hash.slice(1);
        window.setTimeout(() => document.getElementById(id)?.scrollIntoView(), 0);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return slug;
}

export function App() {
  const legal = useLegalRoute();
  const [summary, setSummary] = useState<CalculationSummary | null>(null);
  const onSummaryChange = useCallback((s: CalculationSummary | null) => setSummary(s), []);

  useEffect(() => initMotion(), []);

  useEffect(() => {
    document.title = legal ? `${legalTitle(legal)} | Imperial Vision` : "Spočítej si úvěr | Imperial Vision";
    if (legal) document.getElementById("main")?.focus();
  }, [legal]);

  return (
    <>
      {!legal && <a className="skip-link" href="#kalkulacka">Přeskočit na kalkulačku</a>}
      <Header overlay={!legal} />
      {legal ? (
        <LegalPage slug={legal} />
      ) : (
        <main id="main">
          <Hero />
          <PartnerMarquee />
          <Explainer />
          <CalcSection onSummaryChange={onSummaryChange} />
          <Reviews />
          <FinalCta summary={summary} />
        </main>
      )}
      <Footer />
      <CookieConsent />
    </>
  );
}

export function legalTitle(slug: string) {
  return (
    { "ochrana-osobnich-udaju": "Ochrana osobních údajů", cookies: "Zásady používání cookies", "pravni-informace": "Právní informace" }[
      slug
    ] ?? "Stránka nenalezena"
  );
}

/** Sekce s kalkulačkou (sdílená webem i verzí pro GoHighLevel). */
export function CalcSection({ onSummaryChange }: { onSummaryChange: (s: CalculationSummary | null) => void }) {
  return (
    <section id="kalkulacka" className="calc-section" aria-labelledby="calc-title" tabIndex={-1}>
      <div className="iv-container">
        <div className="section-head" data-reveal>
          <h2 id="calc-title" className="h2">Zjistěte, kolik můžete refinancováním nebo konsolidací <span className="accent">ušetřit.</span></h2>
          <p className="section-head__lead">
            Zadejte údaje o současném úvěru. Výsledek se přepočítá okamžitě. Předvyplněné hodnoty jsou pouze ilustrativní.
          </p>
        </div>
        <Calculator onSummaryChange={onSummaryChange} onRequestContact={() => scrollToId("kontakt", "input")} />
      </div>
    </section>
  );
}
