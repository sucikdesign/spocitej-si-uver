/**
 * Odeslání poptávky z kontaktního formuláře.
 *
 * Backend zatím NENÍ k dispozici. Dokud není v `SITE.integrations.leadEndpoint`
 * nastaven endpoint, funkce data nikam neodesílá ani neukládá a vrací stav
 * `not-configured` – formulář to uživateli pravdivě sdělí.
 *
 * Očekávaný kontrakt endpointu (viz README):
 *   POST {leadEndpoint}  Content-Type: application/json
 *   body: LeadPayload    → 2xx = přijato, jinak chyba
 */

import { SITE } from "../config/site";

export interface LeadPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredContact: "phone" | "email";
  consentPersonalData: true;
  /** Volitelně přiložené výsledky kalkulace (jen pokud to uživatel zvolil). */
  calculation?: Record<string, string> | null;
  source: "spocitej-si-uver";
  submittedAt: string;
}

export type SubmitResult =
  | { status: "sent" }
  | { status: "not-configured" }
  | { status: "error"; message: string };

/** Konfigurace za běhu (verze pro GoHighLevel ji nastavuje v kódu stránky). */
interface RuntimeConfig {
  leadEndpoint?: string;
  /** "json" = POST application/json (výchozí), "form" = x-www-form-urlencoded bez CORS preflightu (GHL Inbound Webhook). */
  leadFormat?: "json" | "form";
}
export function runtimeConfig(): RuntimeConfig {
  return ((typeof window !== "undefined" && (window as unknown as { IV_CONFIG?: RuntimeConfig }).IV_CONFIG) || {}) as RuntimeConfig;
}
export function leadEndpoint(): string | null {
  return runtimeConfig().leadEndpoint || SITE.integrations.leadEndpoint;
}

/** Plochá data pro GHL (pole kontaktu + výsledek kalkulace jako text do poznámky). */
function toFlatFields(p: LeadPayload): Record<string, string> {
  const [firstName, ...rest] = p.name.split(/\s+/);
  const calcText = p.calculation
    ? Object.entries(p.calculation).map(([k, v]) => `${k}: ${v}`).join("\n")
    : "nepřiloženo";
  return {
    name: p.name,
    first_name: firstName ?? "",
    last_name: rest.join(" "),
    email: p.email,
    phone: p.phone,
    message: p.message,
    preferred_contact: p.preferredContact === "phone" ? "telefonicky" : "e-mailem",
    consent_personal_data: "ano",
    calculation: calcText,
    source: p.source,
    submitted_at: p.submittedAt,
    page_url: typeof window !== "undefined" ? window.location.href.split("#")[0] : "",
  };
}

export async function submitLead(payload: LeadPayload): Promise<SubmitResult> {
  const endpoint = leadEndpoint();
  if (!endpoint) return { status: "not-configured" };
  const form = runtimeConfig().leadFormat === "form";

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15_000);
    if (form) {
      // GHL Inbound Webhook: jednoduchý požadavek bez preflightu; odpověď je „opaque“,
      // takže úspěch poznáme jen podle toho, že síťové volání neselhalo.
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams(toFlatFields(payload)).toString(),
        credentials: "omit",
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      return { status: "sent" };
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (!res.ok) return { status: "error", message: `Server vrátil chybu ${res.status}.` };
    return { status: "sent" };
  } catch {
    return { status: "error", message: "Nepodařilo se spojit se serverem." };
  }
}

/* --- validace (sdílená s UI) ------------------------------------------- */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** České / slovenské číslo: volitelně +420/+421, 9 číslic, mezery povoleny. */
export const PHONE_RE = /^(\+42[01])?\s?\d{3}\s?\d{3}\s?\d{3}$/;

export function sanitize(value: string, max = 2000): string {
  // odstranění řídicích znaků, oříznutí délky; HTML escapuje React při renderu
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}
