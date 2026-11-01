import { useId, useRef, useState, type FormEvent } from "react";
import { EMAIL_RE, PHONE_RE, leadEndpoint, sanitize, submitLead, type SubmitResult } from "../lib/contact";
import { SITE } from "../config/site";
import type { CalculationSummary } from "./Calculator";
import { Arrow } from "./Calculator";

interface Props {
  summary: CalculationSummary | null;
}

type Errors = Partial<Record<"name" | "email" | "phone" | "consent", string>>;

export function ContactForm({ summary }: Props) {
  const id = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [preferred, setPreferred] = useState<"phone" | "email">("phone");
  const [consent, setConsent] = useState(false);
  const [attach, setAttach] = useState(true);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const integrated = Boolean(leadEndpoint());

  function validate(): Errors {
    const e: Errors = {};
    if (sanitize(name, 120).length < 2) e.name = "Zadejte své jméno.";
    const em = email.trim();
    const ph = phone.trim();
    if (!em && !ph) {
      e.email = "Zadejte e-mail nebo telefon, abychom vás mohli kontaktovat.";
    }
    if (em && !EMAIL_RE.test(em)) e.email = "Zadejte e-mail ve tvaru jmeno@domena.cz.";
    if (ph && !PHONE_RE.test(ph)) e.phone = "Zadejte telefon ve tvaru +420 123 456 789.";
    if (preferred === "phone" && !ph && !e.email) e.phone = "Zvolili jste kontakt telefonem – doplňte prosím číslo.";
    if (preferred === "email" && !em && !e.email) e.email = "Zvolili jste kontakt e-mailem – doplňte prosím adresu.";
    if (!consent) e.consent = "Pro zpracování poptávky potřebujeme váš souhlas.";
    return e;
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setResult(null);
    if (Object.keys(e).length > 0) {
      const first = ev.currentTarget.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    if (honeypot) {
      // bot – tváříme se neutrálně, nic neodesíláme
      setResult({ status: "not-configured" });
      return;
    }
    setBusy(true);
    const res = await submitLead({
      name: sanitize(name, 120),
      email: sanitize(email, 200),
      phone: sanitize(phone, 30),
      message: sanitize(message, 2000),
      preferredContact: preferred,
      consentPersonalData: true,
      calculation: attach ? summary : null,
      source: "spocitej-si-uver",
      submittedAt: new Date().toISOString(),
    });
    setBusy(false);
    setResult(res);
    window.setTimeout(() => statusRef.current?.focus(), 0);
  }

  const f = (k: string) => `${id}-${k}`;
  const describe = (k: keyof Errors, extra?: string) =>
    [errors[k] ? f(`${k}-err`) : "", extra ?? ""].filter(Boolean).join(" ") || undefined;

  if (result?.status === "sent") {
    return (
      <div className="form-status form-status--success" ref={statusRef} tabIndex={-1} role="status">
        <h3>Děkujeme, poptávku jsme přijali.</h3>
        <p>Odborník z Imperial Vision se vám ozve {preferred === "phone" ? "telefonicky" : "e-mailem"}.</p>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={onSubmit} noValidate aria-labelledby={f("title")}>
      <h3 id={f("title")} className="cform__title">Nezávazná konzultace</h3>

      {!integrated && (
        <p className="cform__integration" role="note">
          <strong>Ukázkový režim:</strong> odesílání formuláře zatím není napojeno. Zadané údaje se nikam neodešlou
          ani neuloží.
        </p>
      )}

      <div className={`field${errors.name ? " field--invalid" : ""}`}>
        <label className="field__label" htmlFor={f("name")}>Jméno a příjmení</label>
        <input
          id={f("name")}
          className="field__input"
          type="text"
          autoComplete="name"
          value={name}
          maxLength={120}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describe("name")}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <p id={f("name-err")} className="field__error">{errors.name}</p>}
      </div>

      <div className="cform__pair">
        <div className={`field${errors.phone ? " field--invalid" : ""}`}>
          <label className="field__label" htmlFor={f("phone")}>Telefon</label>
          <input
            id={f("phone")}
            className="field__input"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+420"
            value={phone}
            maxLength={30}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describe("phone")}
            onChange={(e) => setPhone(e.target.value)}
          />
          {errors.phone && <p id={f("phone-err")} className="field__error">{errors.phone}</p>}
        </div>
        <div className={`field${errors.email ? " field--invalid" : ""}`}>
          <label className="field__label" htmlFor={f("email")}>E-mail</label>
          <input
            id={f("email")}
            className="field__input"
            type="email"
            autoComplete="email"
            value={email}
            maxLength={200}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describe("email")}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p id={f("email-err")} className="field__error">{errors.email}</p>}
        </div>
      </div>

      <fieldset className="field field--group">
        <legend className="field__label">Preferovaný kontakt</legend>
        <div className="segmented">
          <label className="segmented__opt">
            <input type="radio" name={f("pref")} checked={preferred === "phone"} onChange={() => setPreferred("phone")} />
            <span>Telefonicky</span>
          </label>
          <label className="segmented__opt">
            <input type="radio" name={f("pref")} checked={preferred === "email"} onChange={() => setPreferred("email")} />
            <span>E-mailem</span>
          </label>
        </div>
      </fieldset>

      <div className="field">
        <label className="field__label" htmlFor={f("msg")}>
          Zpráva <span className="field__optional">(nepovinné)</span>
        </label>
        <textarea
          id={f("msg")}
          className="field__input field__textarea"
          rows={3}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* honeypot proti spamu – skryté pro uživatele i čtečky */}
      <div className="hp" aria-hidden="true">
        <label htmlFor={f("web")}>Web</label>
        <input id={f("web")} tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {summary && (
        <div className="field">
          <label className="check">
            <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} />
            <span>Přiložit výsledky z kalkulačky</span>
          </label>
          {attach && (
            <details className="cform__summary">
              <summary>Co se přiloží</summary>
              <dl>
                {Object.entries(summary).map(([k, val]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{val}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </div>
      )}

      <div className={`field${errors.consent ? " field--invalid" : ""}`}>
        <label className="check">
          <input
            type="checkbox"
            checked={consent}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={describe("consent")}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Souhlasím se zpracováním osobních údajů za účelem vyřízení poptávky. Více v{" "}
            <a href="#/ochrana-osobnich-udaju">zásadách ochrany osobních údajů</a>.
          </span>
        </label>
        {errors.consent && <p id={f("consent-err")} className="field__error">{errors.consent}</p>}
      </div>

      <button type="submit" className="btn btn--black btn--block" disabled={busy} aria-busy={busy || undefined}>
        {busy ? "Odesílám…" : "Probrat možnosti refinancování"}
        {!busy && <Arrow />}
      </button>

      <div ref={statusRef} tabIndex={-1} role="status" className="cform__status-wrap">
        {result?.status === "not-configured" && (
          <div className="form-status form-status--warning">
            <strong>Poptávka nebyla odeslána.</strong> Formulář je připravený, ale zatím není propojený s
            odesíláním dat. Vaše údaje nebyly nikam odeslány ani uloženy.
            {SITE.contact.phone || SITE.contact.email ? (
              <>
                {" "}Kontaktujte nás prosím přímo:{" "}
                {SITE.contact.phone && <a href={`tel:${SITE.contact.phone.replace(/\s/g, "")}`}>{SITE.contact.phone}</a>}
                {SITE.contact.phone && SITE.contact.email && " · "}
                {SITE.contact.email && <a href={`mailto:${SITE.contact.email}`}>{SITE.contact.email}</a>}
              </>
            ) : null}
          </div>
        )}
        {result?.status === "error" && (
          <div className="form-status form-status--error">
            <strong>Odeslání se nezdařilo.</strong> {result.message} Zkuste to prosím znovu.
          </div>
        )}
      </div>
    </form>
  );
}
