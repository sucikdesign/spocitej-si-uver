/**
 * Verze webu pro GoHighLevel (GHL).
 *
 * Stránka v GHL se skládá ze sekcí; v každé je prvek „Custom Code“ jen s
 * prázdným místem pro sekci, např. <div data-iv="hero"></div>.
 * Tento skript (načtený v Header kódu stránky) najde všechna místa a vykreslí
 * do nich příslušné sekce webu. Navigace, cookie lišta a právní stránky
 * (jako překryvné okno) se vkládají přímo do <body>.
 *
 * Všechny sekce sdílí jeden React strom (portály) – výsledek kalkulačky se tak
 * dostane i do kontaktního formuláře v jiné sekci.
 */
import { StrictMode, useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { CalcSection, legalTitle } from "./App";
import type { CalculationSummary } from "./components/Calculator";
import { Explainer, Header, Hero, PartnerMarquee, Reviews } from "./components/Sections";
import { FinalCta, Footer, LegalPage } from "./components/Closing";
import { CookieConsent } from "./components/CookieConsent";
import { initMotion } from "./lib/motion";
import "./styles/tokens.css";
import "./styles/app.css";

const SECTION_NAMES = ["hero", "partneri", "jak-to-funguje", "kalkulacka", "recenze", "kontakt", "paticka"] as const;
type SectionName = (typeof SECTION_NAMES)[number];

function findMounts(): Partial<Record<SectionName, HTMLElement>> {
  const out: Partial<Record<SectionName, HTMLElement>> = {};
  document.querySelectorAll<HTMLElement>("[data-iv]").forEach((el) => {
    const name = el.dataset.iv as SectionName;
    if (!SECTION_NAMES.includes(name) || out[name]) return;
    el.classList.add("iv", "iv-mount");
    // GHL obaluje kód vlastními bloky – označíme je, aby šly v CSS vynulovat okraje
    let p = el.parentElement;
    for (let i = 0; p && i < 8 && p !== document.body; i++, p = p.parentElement) p.classList.add("iv-ghl-wrap");
    out[name] = el;
  });
  return out;
}

function useLegalSlug(): string | null {
  const read = () => (window.location.hash.startsWith("#/") ? window.location.hash.slice(2) : null);
  const [slug, setSlug] = useState<string | null>(read);
  useEffect(() => {
    const onHash = () => setSlug(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return slug;
}

/** Právní stránka jako překryvné okno (GHL má jen jednu stránku). */
function LegalOverlay({ slug }: { slug: string }) {
  const close = () => {
    history.pushState(null, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${legalTitle(slug)} | Imperial Vision`;
    document.documentElement.classList.add("iv-legal-open");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.querySelector<HTMLElement>(".legal-overlay")?.focus();
    return () => {
      document.title = prevTitle;
      document.documentElement.classList.remove("iv-legal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [slug]);
  return (
    <div className="legal-overlay" role="dialog" aria-modal="true" aria-label={legalTitle(slug)} tabIndex={-1}>
      <button type="button" className="legal-overlay__close btn btn--line btn--sm" onClick={close}>
        Zavřít
      </button>
      <LegalPage slug={slug} />
    </div>
  );
}

function GhlApp({ mounts }: { mounts: Partial<Record<SectionName, HTMLElement>> }) {
  const legal = useLegalSlug();
  const [summary, setSummary] = useState<CalculationSummary | null>(null);
  const onSummaryChange = useCallback((s: CalculationSummary | null) => setSummary(s), []);
  useEffect(() => initMotion(), []);

  const at = (name: SectionName, node: ReactNode) => {
    const el = mounts[name];
    return el ? createPortal(node, el, name) : null;
  };

  return (
    <>
      {mounts.kalkulacka && <a className="skip-link" href="#kalkulacka">Přeskočit na kalkulačku</a>}
      <Header overlay={Boolean(mounts.hero)} />
      {at("hero", <Hero />)}
      {at("partneri", <PartnerMarquee />)}
      {at("jak-to-funguje", <Explainer />)}
      {at("kalkulacka", <CalcSection onSummaryChange={onSummaryChange} />)}
      {at("recenze", <Reviews />)}
      {at("kontakt", <FinalCta summary={summary} />)}
      {at("paticka", <Footer />)}
      {legal && <LegalOverlay slug={legal} />}
      <CookieConsent />
    </>
  );
}

function start() {
  const mounts = findMounts();
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("motion");
    if (mounts.hero && !window.location.hash.startsWith("#/")) document.documentElement.classList.add("intro-playing");
  }
  const host = document.createElement("div");
  host.className = "iv iv-global";
  document.body.appendChild(host);
  createRoot(host).render(
    <StrictMode>
      <GhlApp mounts={mounts} />
    </StrictMode>,
  );
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
else start();
