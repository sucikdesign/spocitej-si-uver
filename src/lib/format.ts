/** České formáty čísel a měny (mezera jako oddělovač tisíců, čárka jako desetinná). */

const czk0 = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const int = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

/** 1234567.4 → „1 234 567 Kč“ (zaokrouhleno na celé koruny). */
export function formatCZK(value: number): string {
  if (!Number.isFinite(value)) return "—";
  // eliminace „-0 Kč“
  const v = Math.round(value) === 0 ? 0 : value;
  return czk0.format(v);
}

/** Znaménkový zápis rozdílu: „+ 1 200 Kč“ / „− 1 200 Kč“. */
export function formatSignedCZK(value: number): string {
  const r = Math.round(value);
  if (r === 0) return formatCZK(0);
  return `${r > 0 ? "+" : "−"} ${formatCZK(Math.abs(r))}`;
}

export function formatInt(value: number): string {
  return Number.isFinite(value) ? int.format(Math.round(value)) : "";
}

export function formatPercent(value: number): string {
  return Number.isFinite(value) ? `${pct.format(value)} %` : "—";
}

/**
 * Parsuje uživatelský vstup v českém i anglickém zápisu:
 * „3 000 000“, „3000000 Kč“, „4,59“, „4.59 %“. Prázdný vstup → null.
 * Neplatný vstup → NaN (validace pak zobrazí chybu).
 */
export function parseNumber(raw: string): number | null {
  const s = raw
    .replace(/[\s  ]/g, "")
    .replace(/kč|czk|%/gi, "")
    .replace(",", ".");
  if (s === "") return null;
  if (!/^-?\d*\.?\d*$/.test(s) || s === "." || s === "-") return NaN;
  return Number(s);
}

/** Formát pro zobrazení v editovatelném poli (bez měny). */
export function formatForInput(value: number | null, decimals = 0): string {
  if (value === null || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: decimals,
    useGrouping: decimals === 0,
  }).format(value);
}
