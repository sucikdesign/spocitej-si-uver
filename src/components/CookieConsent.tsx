import { useEffect, useRef, useState } from "react";
import { OPEN_COOKIE_SETTINGS, readConsent, saveConsent } from "../lib/consent";

/**
 * Cookie lišta + dialog nastavení.
 * Tlačítka „Přijmout vše“ a „Odmítnout nepovinné“ mají stejnou vizuální váhu.
 * Lišta nezakrývá obsah modálně – web lze používat i bez volby; volitelné
 * skripty se ale do udělení souhlasu nespustí.
 */
export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const state = readConsent();
    if (!state) setShowBanner(true);
    else {
      setAnalytics(state.analytics);
      setMarketing(state.marketing);
    }
    const open = () => openDialog();
    window.addEventListener(OPEN_COOKIE_SETTINGS, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, open);
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (dialogOpen && !d.open) d.showModal();
    if (!dialogOpen && d.open) d.close();
  }, [dialogOpen]);

  function openDialog() {
    returnFocus.current = document.activeElement as HTMLElement | null;
    const state = readConsent();
    setAnalytics(state?.analytics ?? false);
    setMarketing(state?.marketing ?? false);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    window.setTimeout(() => returnFocus.current?.focus?.(), 0);
  }

  function decide(choice: { analytics: boolean; marketing: boolean }) {
    saveConsent(choice);
    setAnalytics(choice.analytics);
    setMarketing(choice.marketing);
    setShowBanner(false);
    if (dialogOpen) closeDialog();
  }

  return (
    <>
      {showBanner && (
        <section className="cookie-bar" aria-labelledby="cookie-bar-title" role="region">
          <div className="cookie-bar__inner">
            <div className="cookie-bar__text">
              <h2 id="cookie-bar-title" className="cookie-bar__title">Cookies na tomto webu</h2>
              <p>
                Nezbytné cookies používáme pro fungování webu. Analytické a marketingové cookies použijeme jen s vaším
                souhlasem. Volbu můžete kdykoli změnit v patičce v části „Nastavení cookies“.{" "}
                <a href="#/cookies">Zásady cookies</a>
              </p>
            </div>
            <div className="cookie-bar__actions">
              <button type="button" className="btn btn--primary btn--sm" onClick={() => decide({ analytics: true, marketing: true })}>
                Přijmout vše
              </button>
              <button type="button" className="btn btn--primary btn--sm" onClick={() => decide({ analytics: false, marketing: false })}>
                Odmítnout nepovinné
              </button>
              <button type="button" className="btn btn--outline btn--sm" onClick={openDialog}>
                Nastavení cookies
              </button>
            </div>
          </div>
        </section>
      )}

      <dialog
        ref={dialogRef}
        className="cookie-dialog"
        aria-labelledby="cookie-dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          closeDialog();
        }}
      >
        <form
          method="dialog"
          onSubmit={(e) => {
            e.preventDefault();
            decide({ analytics, marketing });
          }}
        >
          <div className="cookie-dialog__head">
            <h2 id="cookie-dialog-title" className="cookie-dialog__title">Nastavení cookies</h2>
            <button type="button" className="icon-btn" onClick={closeDialog} aria-label="Zavřít nastavení cookies">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M4 4l10 10M14 4 4 14" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
          </div>

          <ul className="consent-list">
            <li className="consent-item">
              <div>
                <h3>Nezbytné</h3>
                <p>Zajišťují základní funkce webu a uložení vaší volby. Nelze je vypnout.</p>
              </div>
              <Switch checked disabled label="Nezbytné cookies – vždy aktivní" />
            </li>
            <li className="consent-item">
              <div>
                <h3>Analytické</h3>
                <p>Pomáhají nám anonymně měřit návštěvnost a zlepšovat web. Momentálně nejsou nasazeny žádné nástroje.</p>
              </div>
              <Switch checked={analytics} onChange={setAnalytics} label="Analytické cookies" />
            </li>
            <li className="consent-item">
              <div>
                <h3>Marketingové</h3>
                <p>Slouží k měření kampaní a zobrazování relevantní reklamy. Momentálně nejsou nasazeny žádné nástroje.</p>
              </div>
              <Switch checked={marketing} onChange={setMarketing} label="Marketingové cookies" />
            </li>
          </ul>

          <div className="cookie-dialog__actions">
            <button type="submit" className="btn btn--primary btn--sm">Uložit volbu</button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => decide({ analytics: true, marketing: true })}>
              Přijmout vše
            </button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => decide({ analytics: false, marketing: false })}>
              Odmítnout nepovinné
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
      <span className="sr-only">{label}</span>
    </label>
  );
}
