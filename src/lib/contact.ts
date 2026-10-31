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

export async function submitLead(payload: LeadPayload): Promise<SubmitResult> {
  const endpoint = SITE.integrations.leadEndpoint;
  if (!endpoint) return { status: "not-configured" };

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15_000);
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
