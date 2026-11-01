/**
 * Prvky identity Imperial Vision.
 * Logo se používá VÝHRADNĚ jako originální SVG soubor (bez úprav geometrie).
 * Soubor obsahuje i ochrannou zónu (vnitřní okraj viewBoxu) – proto se
 * logo neořezává a vedle něj nesmí být v tomto prostoru jiné prvky.
 */

const LOGO_SRC = {
  white: "/assets/brand/imperial-vision-logo-horizontal-white.svg",
  black: "/assets/brand/imperial-vision-logo-horizontal-black.svg",
  /** Dodaný soubor UPRAVLOGO.png (stejné plátno 2925 × 1444 vč. ochranné zóny), zmenšený do WebP. */
  gradient: "/assets/brand/imperial-vision-logo-horizontal-gradient.webp",
} as const;

const SYMBOL_SRC = {
  white: "/assets/brand/imperial-vision-symbol-white.svg",
  black: "/assets/brand/imperial-vision-symbol-black.svg",
} as const;

/** Poměr stran originálního souboru loga (2925 × 1444). */
export const LOGO_RATIO = 2925 / 1444;

interface LogoProps {
  variant: keyof typeof LOGO_SRC;
  /** Výška celého souboru včetně ochranné zóny (viditelné logo ≈ 51 %). */
  height: number;
  className?: string;
  /** Duplicitní varianta (např. pro přepnutí barvy) – skrytá pro čtečky. */
  decorative?: boolean;
}

export function Logo({ variant, height, className, decorative }: LogoProps) {
  return (
    <img
      className={`logo ${className ?? ""}`}
      src={LOGO_SRC[variant]}
      alt={decorative ? "" : "Imperial Vision"}
      aria-hidden={decorative || undefined}
      width={Math.round(height * LOGO_RATIO)}
      height={height}
      decoding="async"
    />
  );
}

/** Poměr stran společného loga Imperial Vision × SAB servis (4790 × 735, bez okraje). */
export const COBRAND_RATIO = 4790 / 735;

/**
 * Společné logo Imperial Vision × SAB servis (dodaný soubor IMPERIALxSAB[white].svg, beze změn).
 * Výška odpovídá viditelné výšce loga v navigaci (≈ 33 px).
 */
export function CoBrandLogo({ height = 33, className }: { height?: number; className?: string }) {
  return (
    <img
      className={`logo logo--cobrand ${className ?? ""}`}
      src="/assets/brand/imperial-vision-x-sab-servis-white.svg"
      alt="Imperial Vision × SAB servis"
      width={Math.round(height * COBRAND_RATIO)}
      height={height}
      decoding="async"
    />
  );
}

/** Symbol jako dekorativní identifikační prvek [MANUÁL 4.5]. */
export function SymbolMark({ variant, className }: { variant: "white" | "black"; className?: string }) {
  return <img className={className} src={SYMBOL_SRC[variant]} alt="" aria-hidden="true" decoding="async" />;
}
