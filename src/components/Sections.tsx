import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Logo, SymbolMark } from "./Brand";
import { Arrow } from "./Calculator";
import { partners, type Partner } from "../data/partners";
import {
  GOOGLE_PROFILE_URL,
  placeholderReviews,
  reviews,
  reviewSummary,
  SHOW_REVIEW_PLACEHOLDERS,
  type Review,
} from "../data/reviews";
import { SITE } from "../config/site";

export function scrollToId(id: string, focusSelector?: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  const target = focusSelector ? el.querySelector<HTMLElement>(focusSelector) : el;
  window.setTimeout(() => target?.focus({ preventScroll: true }), 450);
  history.replaceState(null, "", `#${id}`);
}

/* ------------------------------------------------------------------------ */
/* Header                                                                   */
/* ------------------------------------------------------------------------ */

const NAV = [
  { href: "#kalkulacka", label: "Kalkulačka" },
  { href: "#refinancovani", label: "Jak to funguje" },
  { href: "#recenze", label: "Recenze" },
];

/**
 * Header leží průhledně nad gradientovým hero (bílé logo a ovládání).
 * Jakmile hero odroluje pod header, header se invertuje: bílá plocha,
 * černé logo a černé ovládání. Na stránkách bez hero je rovnou invertovaný.
 */
export function Header({ overlay }: { overlay: boolean }) {
  const [solid, setSolid] = useState(!overlay);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!overlay) {
      setSolid(true);
      return;
    }
    const update = () => {
      const hero = document.querySelector<HTMLElement>(".hero");
      const headerH = document.querySelector<HTMLElement>(".header")?.offsetHeight ?? 72;
      setSolid(!hero || hero.getBoundingClientRect().bottom <= headerH);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [overlay]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const inverted = solid || open;

  return (
    <header className={`header${inverted ? " is-solid" : " is-overlay"}${open ? " is-open" : ""}`}>
      <div className="header__bar">
      <div className="container header__inner">
        <a className="header__brand" href="#top" aria-label="Spočítej si úvěr – Imperial Vision, na začátek stránky">
          <Logo variant="white" height={64} className="logo--on-dark" />
          <Logo variant="gradient" height={64} className="logo--on-light" decorative />
        </a>
        <button
          type="button"
          className="header__toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">{open ? "Zavřít menu" : "Otevřít menu"}</span>
          <span className="header__burger" aria-hidden="true" />
        </button>
        <nav id="main-nav" className="header__nav" aria-label="Hlavní navigace">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} onClick={() => setOpen(false)}>{n.label}</a>
              </li>
            ))}
          </ul>
          <a className="btn btn--line btn--sm" href="#kontakt" onClick={() => setOpen(false)}>
            Konzultace
          </a>
        </nav>
      </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------------ */
/* Hero                                                                     */
/* ------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------ */
/* Úvodní gradientové video v hero                                          */
/* ------------------------------------------------------------------------ */

/** Délka úvodu (video přes celou obrazovku), pak se zmenší do bloku. */
const INTRO_MS = 1000;
/** Pojistka: když se video nerozběhne (úsporný režim, chyba), obsah se ukáže i tak. */
const INTRO_FAILSAFE_MS = 6000;

/**
 * Gradientové video v hero (gradientwebHERO.mp4, 20 s, smyčka).
 *  1. Po načtení hraje přes celou obrazovku (≈ 1 s).
 *  2. Pak se `intro-playing` na <html> vymění za `intro-done`: video se plynule
 *     zmenší do zaobleného bloku, současně naběhne obsah hero i navigace a video
 *     se zastaví.
 *  3. Dál se přehrává jen při najetí myší na hero (hover), po odjetí se zastaví.
 * Jakákoli interakce (scroll, klávesa, dotyk) úvod okamžitě ukončí.
 */
function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  // 1920 px pro desktop, 1280 px pro mobil/tablet; MP4 (H.264) + WebM (VP9)
  const [sources] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches
      ? { mp4: "/assets/video/hero-1920.mp4", webm: "/assets/video/hero-1920.webm" }
      : { mp4: "/assets/video/hero-1280.mp4", webm: "/assets/video/hero-1280.webm" },
  );

  useEffect(() => {
    const video = ref.current;
    const root = document.documentElement;
    const hero = video?.closest<HTMLElement>(".hero");
    if (!video || !hero) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let done = false;
    let hovering = false;

    const finish = () => {
      if (done) return;
      done = true;
      root.classList.remove("intro-playing");
      root.classList.add("intro-done");
      if (!hovering) video.pause();
    };
    void reduced;

    // Přehrávání na hover: poloha kurzoru se hlídá na celém okně, takže funguje
    // i nad textem, tlačítky a navigací, která leží přes video, a i když kurzor
    // stojí nad hero už při načtení stránky. Spouští se jen myší / trackpadem.
    const media = video.parentElement as HTMLElement;
    const update = () => {
      if (!done) return;
      if (hovering) {
        if (video.paused) video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = media.getBoundingClientRect();
      const m = 12; // odsazení viditelného bloku od okrajů (≈ --hero-inset)
      hovering = e.clientX >= r.left + m && e.clientX <= r.right - m && e.clientY >= r.top + m && e.clientY <= r.bottom - m;
      update();
    };
    const onOut = (e: PointerEvent) => {
      // kurzor opustil okno prohlížeče
      if (!e.relatedTarget) { hovering = false; update(); }
    };
    const onScrollHover = () => {
      if (!hovering) return;
      const r = media.getBoundingClientRect();
      if (r.bottom < 0) { hovering = false; update(); }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onOut);
    window.addEventListener("scroll", onScrollHover, { passive: true });
    const removeHover = () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("scroll", onScrollHover);
    };

    if (reduced) {
      root.classList.remove("intro-playing");
      root.classList.add("intro-done");
      done = true;
      video.pause();
      return removeHover;
    }

    root.classList.add("intro-playing");
    const skip = () => finish();
    video.querySelector("source:last-of-type")?.addEventListener("error", finish);
    window.addEventListener("wheel", skip, { passive: true, once: true });
    window.addEventListener("touchstart", skip, { passive: true, once: true });
    window.addEventListener("keydown", skip, { once: true });
    let introTimer = 0;
    const startIntro = () => { introTimer = window.setTimeout(finish, INTRO_MS); };
    video.addEventListener("playing", startIntro, { once: true });
    const failsafe = window.setTimeout(finish, INTRO_FAILSAFE_MS);
    video.play().catch(finish);

    return () => {
      window.clearTimeout(failsafe);
      window.clearTimeout(introTimer);
      video.removeEventListener("playing", startIntro);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
      window.removeEventListener("keydown", skip);
      removeHover();
      root.classList.remove("intro-playing");
    };
  }, []);

  return (
    <div className="hero__media" aria-hidden="true">
      <video
        ref={ref}
        className="hero__video"
        poster="/assets/video/hero-first.webp"
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
        disablePictureInPicture
      >
        <source src={sources.mp4} type="video/mp4" />
        <source src={sources.webm} type="video/webm" />
      </video>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <HeroVideo />
      <div className="container hero__inner">
        <h1 id="hero-title" className="hero__title" aria-label="Spočítej si úvěr.">
          {["Spočítej", "si", "úvěr."].map((w, i) => (
            <span
              key={w}
              className={`hero__word${i === 2 ? " hero__word--accent" : ""}`}
              aria-hidden="true"
              style={{ "--i": i } as CSSProperties}
            >
              {w}
            </span>
          ))}
        </h1>
        <p className="hero__lead hero__intro" style={{ "--i": 3 } as CSSProperties}>
          Zjistěte, <strong>kolik můžete ušetřit</strong> refinancováním svého úvěru.
        </p>
        <div className="hero__actions hero__intro" style={{ "--i": 4 } as CSSProperties}>
          <a
            className="btn btn--line"
            href="#kalkulacka"
            onClick={(e) => {
              e.preventDefault();
              scrollToId("kalkulacka", "input");
            }}
          >
            Spočítat úsporu
            <Arrow />
          </a>
          <a className="btn btn--line btn--tint" href="#refinancovani">Jak to funguje</a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Partnerská loga – nekonečný slider                                       */
/* ------------------------------------------------------------------------ */

export function PartnerMarquee() {
  const items = partners;
  return (
    <section className="partners" aria-label="Partnerské banky">
      {/* posun se zastaví při najetí myší / fokusu; při prefers-reduced-motion je statický */}
      <div className="marquee" style={{ "--marquee-duration": `${Math.max(40, items.length * 3.2)}s` } as CSSProperties}>
        <ul className="marquee__track" aria-label="Partneři">
          {items.map((p, i) => <PartnerLogo key={`a${i}`} partner={p} />)}
        </ul>
        {/* duplikát pro plynulou smyčku – skrytý pro čtečky */}
        <ul className="marquee__track" aria-hidden="true">
          {items.map((p, i) => <PartnerLogo key={`b${i}`} partner={p} />)}
        </ul>
      </div>
    </section>
  );
}

/** Loga partnerů zmenšená o 15 % oproti opticky vyrovnaným rozměrům v partners.ts. */
const LOGO_SCALE = 0.85;

function PartnerLogo({ partner }: { partner: Partner }) {
  return (
    <li className="marquee__item">
      {partner.logo ? (
        <img
          src={partner.logo}
          alt={partner.name}
          width={Math.round((partner.width ?? 100) * LOGO_SCALE)}
          height={Math.round((partner.height ?? 40) * LOGO_SCALE)}
          decoding="async"
        />
      ) : (
        <span className="logo-placeholder" title="Dočasný placeholder – logo partnera bude doplněno">
          <span className="logo-placeholder__mark" aria-hidden="true" />
          {partner.name}
        </span>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------------ */
/* Vysvětlení refinancování                                                 */
/* ------------------------------------------------------------------------ */

const STEPS = [
  { n: "01", title: "Zadejte informace o úvěru", text: "Zůstatek, sazbu, splátku, zbývající dobu splácení…" },
  { n: "02", title: "Zjistěte zdarma možnou úsporu", text: "Uvidíte možný rozdíl ve splátce a ve výši celkového přeplacení." },
  { n: "03", title: "Zanechte nám kontakt", text: "Náš odborník s vámi poté projde, zda a kolik je podle vaší situace možné ušetřit." },
];

export function Explainer() {
  return (
    <section id="refinancovani" className="explainer" aria-labelledby="explainer-title">
      <div className="explainer__watermark-wrap" aria-hidden="true">
        <SymbolMark variant="white" className="explainer__watermark" />
      </div>
      <div className="container explainer__grid">
        <div data-reveal data-parallax="0.05" className="parallax--desktop">
          <h2 id="explainer-title" className="h2">Možná platíte <span className="accent">víc, než musíte.</span></h2>
        </div>
        <p className="explainer__text parallax--desktop" data-reveal data-reveal-delay="1" data-parallax="0.12">
          Podmínky vašeho úvěru <strong>nemusí být ty nejlepší.</strong> Zajímá vás snížení měsíční splátky
          nebo snížení celkového přeplatku? Zjistěte, <strong>jestli a kolik můžete měsíčně ušetřit.</strong>
        </p>
      </div>
      <ol className="container steps">
        {STEPS.map((s, i) => (
          <li key={s.n} className="steps__item parallax--desktop" data-reveal data-reveal-delay={String(i)} data-parallax={String(0.03 + i * 0.05)}>
            <span className="steps__n" aria-hidden="true">{s.n}</span>
            <h3 className="steps__title">{s.title}</h3>
            <p className="steps__text">{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="container explainer__bridge" data-reveal>
        <a
          className="btn btn--primary"
          href="#kalkulacka"
          onClick={(e) => {
            e.preventDefault();
            scrollToId("kalkulacka", "input");
          }}
        >
          Spočítat úsporu
          <Arrow />
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Recenze                                                                  */
/* ------------------------------------------------------------------------ */

const dateFmt = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" });

export function Reviews() {
  const usingPlaceholders = reviews.length === 0 && SHOW_REVIEW_PLACEHOLDERS;
  /** Na webu se zobrazují 3 recenze; ostatní jsou dostupné přes odkaz na Google. */
  const VISIBLE_REVIEWS = 3;
  const list = (reviews.length > 0 ? reviews : usingPlaceholders ? placeholderReviews : []).slice(0, VISIBLE_REVIEWS);

  return (
    <section id="recenze" className="reviews" aria-labelledby="reviews-title">
      <div className="container">
        <div className="reviews__head" data-reveal>
          <div>
            <p className="eyebrow">Google recenze</p>
            <h2 id="reviews-title" className="h2">Důvěra, která má své <span className="accent">výsledky.</span></h2>
          </div>
          {reviewSummary && (
            <p className="reviews__summary">
              <span className="reviews__avg">
                {reviewSummary.average.toLocaleString("cs-CZ", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span>
                <Stars rating={reviewSummary.average} />
                <span className="reviews__count">{reviewSummary.count} recenzí na Google</span>
              </span>
            </p>
          )}
        </div>

        {usingPlaceholders && (
          <p className="placeholder-note" role="note">
            Testovací ukázka rozložení – skutečné recenze z Google budou doplněny. Níže nejsou zobrazeny žádné reálné
            recenze.
          </p>
        )}

        {list.length > 0 ? (
          <ul className="reviews__list">
            {list.map((r, i) => <ReviewCard key={i} index={i} review={r} />)}
          </ul>
        ) : (
          <p className="reviews__empty">Recenze budou brzy doplněny.</p>
        )}

        {(SITE.integrations.googleReviewsUrl ?? GOOGLE_PROFILE_URL) && (
          <a className="link" href={SITE.integrations.googleReviewsUrl ?? GOOGLE_PROFILE_URL} target="_blank" rel="noopener noreferrer">
            Všechny recenze na Google <span className="sr-only">(otevře se v novém okně)</span>
          </a>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const textId = `review-text-${index}`;
  return (
    <li className={`review${review.placeholder ? " review--placeholder" : ""}`} data-reveal data-reveal-delay={String(Math.min(index, 3))}>
      <figure>
        <div className="review__top">
          {review.rating !== null ? (
            <Stars rating={review.rating} />
          ) : (
            <span className="review__norating">Hodnocení doplní integrace</span>
          )}
          {review.placeholder && <span className="badge">Testovací data</span>}
        </div>
        {/* text je zkrácen na 5 řádků (CSS line-clamp), tlačítko je u všech karet stejně */}
        <blockquote className="review__text">
          <p id={textId} className={expanded ? "is-expanded" : undefined}>{review.text}</p>
        </blockquote>
        <button
          type="button"
          className="link-btn review__more"
          aria-expanded={expanded}
          aria-controls={textId}
          onClick={() => setExpanded((x) => !x)}
        >
          {expanded ? "Zobrazit méně" : "Zobrazit celou recenzi"}
        </button>
        <figcaption className="review__meta">
          <span className="review__author">{review.author}</span>
          <span className="review__date">
            {review.date ? dateFmt.format(new Date(review.date)) : review.relativeDate ?? "Datum doplní integrace"} · Google
          </span>
        </figcaption>
      </figure>
    </li>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars" role="img" aria-label={`Hodnocení ${rating.toLocaleString("cs-CZ")} z 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className={i <= full ? "is-on" : ""}>
          <path d="M8 1.2l2.1 4.4 4.7.6-3.4 3.3.8 4.7L8 12l-4.2 2.2.8-4.7L1.2 6.2l4.7-.6z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}
