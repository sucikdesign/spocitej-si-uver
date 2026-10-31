/**
 * Pohyb na webu – bez externích knihoven.
 *
 *  - Reveal: prvky s atributem [data-reveal] se při vstupu do viewportu jemně
 *    vynoří (CSS přechod spouští atribut data-revealed, který React nepřepisuje).
 *  - Parallax: prvky s [data-parallax="0.15"] dostávají CSS proměnnou --py
 *    podle polohy vůči středu okna. Gradientová pozadí jsou záměrně statická.
 *  - Vše se vypne při prefers-reduced-motion – obsah je pak rovnou viditelný.
 */

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initMotion(): () => void {
  const root = document.documentElement;
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    root.classList.remove("motion");
    return () => {};
  }
  root.classList.add("motion");

  /* --- reveal ------------------------------------------------------------ */
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).dataset.revealed = "true";
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  const observeAll = () =>
    document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])").forEach((el) => io.observe(el));
  observeAll();
  const mo = new MutationObserver(() => observeAll());
  mo.observe(document.body, { childList: true, subtree: true });

  /* --- parallax ---------------------------------------------------------- */
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;

    // prvky: posun přes CSS `translate` (--py); pozadí: background-position (--pby)
    document.querySelectorAll<HTMLElement>("[data-parallax], [data-parallax-bg]").forEach((el) => {
      const isBg = el.hasAttribute("data-parallax-bg");
      const speed = Number(isBg ? el.dataset.parallaxBg : el.dataset.parallax) || 0.1;
      // u prvků s translate měříme polohu bez aktuálního posunu
      const current = isBg ? 0 : parseFloat(el.style.getPropertyValue("--py")) || 0;
      const r = el.getBoundingClientRect();
      const top = r.top - current;
      if (r.bottom < -300 || top > vh + 300) return;
      const offset = (top + r.height / 2 - vh / 2) * speed;
      el.style.setProperty(isBg ? "--pby" : "--py", `${offset.toFixed(1)}px`);
    });
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);


  return () => {
    io.disconnect();
    mo.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}

/** Plynulé dopočítání čísla (count-up) – vrací funkci pro zrušení. */
export function tweenNumber(from: number, to: number, duration: number, onFrame: (v: number) => void): () => void {
  if (prefersReducedMotion() || !Number.isFinite(from) || from === to) {
    onFrame(to);
    return () => {};
  }
  const start = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    onFrame(from + (to - from) * eased);
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
