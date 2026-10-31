/**
 * Správa souhlasu s cookies.
 *
 * - Nezbytné cookies jsou vždy povoleny (technické fungování, uložení souhlasu).
 * - Analytické a marketingové skripty se registrují přes `registerConsentScript`
 *   a spustí se AŽ po udělení příslušného souhlasu. Nic se nenačítá předem.
 * - Souhlas lze kdykoli změnit nebo odvolat (patička → „Nastavení cookies“).
 *   Při odvolání se stránka obnoví, aby se již načtené skripty uvolnily,
 *   a odstraní se cookies uvedené u skriptu v `cookies`.
 */

export type ConsentCategory = "analytics" | "marketing";

export interface ConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** ISO čas udělení / změny souhlasu – pro doložení. */
  updatedAt: string;
  version: number;
}

/** Zvyšte při změně kategorií nebo zpracovatelů → uživatel bude znovu dotázán. */
export const CONSENT_VERSION = 1;
const STORAGE_KEY = "iv_cookie_consent";

type Listener = (state: ConsentState | null) => void;
const listeners = new Set<Listener>();

interface RegisteredScript {
  id: string;
  category: ConsentCategory;
  /** Funkce, která skript vloží (např. GA4, Meta Pixel). */
  load: () => void;
  /** Názvy cookies, které skript zakládá – smažou se při odvolání. */
  cookies?: string[];
  loaded?: boolean;
}
const scripts: RegisteredScript[] = [];

export function readConsent(): ConsentState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    return { ...parsed, necessary: true };
  } catch {
    return null;
  }
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }): ConsentState {
  const previous = readConsent();
  const state: ConsentState = {
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
    updatedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* úložiště nedostupné – souhlas platí jen pro tuto návštěvu */
  }

  const revoked =
    previous !== null &&
    ((previous.analytics && !state.analytics) || (previous.marketing && !state.marketing));

  if (revoked) {
    for (const s of scripts) {
      if (!state[s.category]) s.cookies?.forEach(deleteCookie);
    }
    if (scripts.some((s) => s.loaded && !state[s.category])) {
      window.location.reload();
      return state;
    }
  }

  runAllowedScripts(state);
  listeners.forEach((l) => l(state));
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Registrace volitelného skriptu. Příklad (GA4) – viz README:
 *   registerConsentScript({ id: "ga4", category: "analytics",
 *     cookies: ["_ga", "_ga_XXXX"], load: () => injectScript("https://www.googletagmanager.com/gtag/js?id=G-XXXX") });
 */
export function registerConsentScript(script: Omit<RegisteredScript, "loaded">): void {
  scripts.push({ ...script, loaded: false });
  const state = readConsent();
  if (state) runAllowedScripts(state);
}

function runAllowedScripts(state: ConsentState) {
  for (const s of scripts) {
    if (!s.loaded && state[s.category]) {
      s.loaded = true;
      try {
        s.load();
      } catch (err) {
        console.error(`[consent] Skript ${s.id} se nepodařilo načíst`, err);
      }
    }
  }
}

export function injectScript(src: string, attrs: Record<string, string> = {}): void {
  const el = document.createElement("script");
  el.src = src;
  el.async = true;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
}

function deleteCookie(name: string) {
  const host = window.location.hostname;
  const domains = ["", host, `.${host.replace(/^www\./, "")}`];
  for (const d of domains) {
    document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
  }
}

/** Událost pro otevření nastavení cookies odkudkoli (patička, právní stránky). */
export const OPEN_COOKIE_SETTINGS = "iv:open-cookie-settings";
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS));
}
