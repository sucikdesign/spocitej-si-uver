/**
 * Přehrávání videa jen při najetí myší (hover).
 *
 * Poloha kurzoru se hlídá na celém okně, takže hover funguje i nad textem,
 * tlačítky a dalšími prvky, které leží přes video, a i když kurzor stojí nad
 * plochou už při načtení stránky. Reaguje jen na myš / trackpad, ne na dotyk.
 */
export function attachHoverPlayback(
  video: HTMLVideoElement,
  area: HTMLElement,
  opts: { margin?: number; enabled?: () => boolean } = {},
): { dispose: () => void; isHovering: () => boolean; sync: () => void } {
  const margin = opts.margin ?? 0;
  const enabled = opts.enabled ?? (() => true);
  let hovering = false;

  const sync = () => {
    if (!enabled()) return;
    if (hovering) {
      if (video.paused) video.play().catch(() => {});
    } else if (!video.paused) {
      video.pause();
    }
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = area.getBoundingClientRect();
    hovering =
      e.clientX >= r.left + margin && e.clientX <= r.right - margin &&
      e.clientY >= r.top + margin && e.clientY <= r.bottom - margin;
    sync();
  };
  const onOut = (e: PointerEvent) => {
    // kurzor opustil okno prohlížeče
    if (!e.relatedTarget) { hovering = false; sync(); }
  };
  const onScroll = () => {
    if (!hovering) return;
    const r = area.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) { hovering = false; sync(); }
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerout", onOut);
  window.addEventListener("scroll", onScroll, { passive: true });
  return {
    dispose: () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("scroll", onScroll);
    },
    isHovering: () => hovering,
    sync,
  };
}

/** Zdroje gradientového videa (GRADIENT_loop_10s.mp4) podle šířky okna. */
export function gradientVideoSources() {
  const wide = typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches;
  return wide
    ? { mp4: "/assets/video/hero-1920.mp4", webm: "/assets/video/hero-1920.webm" }
    : { mp4: "/assets/video/hero-1280.mp4", webm: "/assets/video/hero-1280.webm" };
}
