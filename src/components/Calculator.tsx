import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NumberField, TermField, termToMonths, useTouched } from "./fields";
import {
  compareConsolidation,
  formatMonths,
  type ConsolidationErrors,
  type ConsolidationInput,
  type ConsolidationResult,
  type LoanField,
} from "../lib/loanMath";
import { formatCZK, formatPercent, parseNumber } from "../lib/format";
import { prefersReducedMotion, tweenNumber } from "../lib/motion";

export type CalculationSummary = Record<string, string>;

interface CalculatorProps {
  onSummaryChange: (summary: CalculationSummary | null) => void;
  onRequestContact: () => void;
}

interface LoanState {
  id: number;
  balance: string;
  rate: string;
  payment: string;
  remY: string;
  remM: string;
}

const MAX_LOANS = 6;

/**
 * Ilustrativní výchozí hodnoty – slouží jen k ukázce výpočtu.
 * Sazba při refinancování NENÍ nabídkou žádné banky.
 */
const FIRST_LOAN: LoanState = { id: 1, balance: "800 000", rate: "5,89", payment: "", remY: "8", remM: "0" };
const DEFAULT_NEW_RATE = "3,97";

export function Calculator({ onSummaryChange, onRequestContact }: CalculatorProps) {
  const [loans, setLoans] = useState<LoanState[]>([FIRST_LOAN]);
  const [newRate, setNewRate] = useState(DEFAULT_NEW_RATE);
  const [sameTerm, setSameTerm] = useState(true);
  const [newY, setNewY] = useState("8");
  const [newM, setNewM] = useState("0");
  const nextId = useRef(2);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const focusLoanId = useRef<number | null>(null);
  const { touched, touch } = useTouched();

  const many = loans.length > 1;

  const updateLoan = (id: number, key: keyof Omit<LoanState, "id">, field: LoanField) => (val: string) => {
    setLoans((ls) => ls.map((l) => (l.id === id ? { ...l, [key]: val } : l)));
    touch(`${id}:${field}`);
  };

  const addLoan = () => {
    if (loans.length >= MAX_LOANS) return;
    const id = nextId.current++;
    focusLoanId.current = id;
    setLoans((ls) => [...ls, { id, balance: "", rate: "", payment: "", remY: "", remM: "" }]);
  };

  const removeLoan = (id: number) => {
    setLoans((ls) => ls.filter((l) => l.id !== id));
    window.requestAnimationFrame(() => addBtnRef.current?.focus());
  };

  // po přidání úvěru přesuneme fokus na jeho první pole
  useEffect(() => {
    if (focusLoanId.current === null) return;
    const el = document.querySelector<HTMLInputElement>(`[data-loan="${focusLoanId.current}"] input`);
    focusLoanId.current = null;
    el?.focus({ preventScroll: false });
  }, [loans.length]);

  /* --- převod vstupů ---------------------------------------------------- */
  const loanMonths = loans.map((l) => termToMonths(l.remY, l.remM));
  const customMonths = sameTerm ? null : termToMonths(newY, newM);

  const input: ConsolidationInput = {
    loans: loans.map((l, i) => ({
      balance: parseNumber(l.balance),
      rate: parseNumber(l.rate),
      payment: parseNumber(l.payment),
      months: loanMonths[i],
    })),
    newRate: parseNumber(newRate),
    // prázdná vlastní splatnost = chyba (NaN), ne „nejdelší“
    newMonths: sameTerm ? null : customMonths === null ? NaN : customMonths,
  };

  const result = compareConsolidation(input);
  const rawErrors: ConsolidationErrors = result.ok ? { loans: loans.map(() => ({})) } : result.errors;
  loanMonths.forEach((m, i) => {
    if (Number.isNaN(m)) rawErrors.loans[i].months = "Zadejte celé roky a 0–11 měsíců.";
  });
  if (!sameTerm && Number.isNaN(customMonths)) rawErrors.newMonths = "Zadejte celé roky a 0–11 měsíců.";

  // Chyby prázdných povinných polí ukazujeme až po interakci, ostatní hned.
  const loanErr = (i: number, k: LoanField): string | undefined => {
    const e = rawErrors.loans[i]?.[k];
    if (!e) return undefined;
    const raw = input.loans[i][k];
    if (k !== "months" && typeof raw === "number" && Number.isNaN(raw)) return "Zadejte platné číslo, např. 4,59.";
    return raw === null && !touched[`${loans[i].id}:${k}`] ? undefined : e;
  };
  const rateErr = (() => {
    const e = rawErrors.newRate;
    if (!e) return undefined;
    if (typeof input.newRate === "number" && Number.isNaN(input.newRate)) return "Zadejte platné číslo, např. 3,97.";
    return input.newRate === null && !touched.newRate ? undefined : e;
  })();
  const termErr = rawErrors.newMonths && (customMonths !== null || touched.newMonths) ? rawErrors.newMonths : undefined;

  /* --- souhrn pro kontaktní formulář --------------------------------------- */
  const inputKey = JSON.stringify(input);
  const summary = useMemo<CalculationSummary | null>(() => {
    if (!result.ok) return null;
    return buildSummary(input, result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey, result.ok]);

  useEffect(() => onSummaryChange(summary), [summary, onSummaryChange]);

  /* --- zpožděné oznámení pro čtečky obrazovky ----------------------------- */
  const [announcement, setAnnouncement] = useState("");
  const liveText = result.ok
    ? `Splátka po ${many ? "konsolidaci" : "refinancování"} ${formatCZK(result.newPayment)}, ` +
      `${result.monthlyDifference >= 0 ? "měsíčně méně o" : "měsíčně více o"} ${formatCZK(Math.abs(result.monthlyDifference))}, ` +
      `${result.totalDifference >= 0 ? "celková úspora" : "celkově více o"} ${formatCZK(Math.abs(result.totalDifference))}.`
    : "Výsledek se zobrazí po doplnění platných údajů.";
  useEffect(() => {
    const t = window.setTimeout(() => setAnnouncement(liveText), 900);
    return () => window.clearTimeout(t);
  }, [liveText]);

  return (
    <div className="calc">
      <form className="calc__form" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Kalkulačka refinancování a konsolidace">
        <div className="calc__group" data-reveal>
          <div className="calc__group-head">
            <span className="calc__step" aria-hidden="true">01</span>
            <h3 className="calc__group-title">{many ? "Současné úvěry" : "Současný úvěr"}</h3>
          </div>

          {loans.map((l, i) => (
            <Fragment key={l.id}>
              <fieldset className={`loan${many ? " loan--multi" : ""}`} data-loan={l.id}>
                <legend className={many ? "loan__title" : "sr-only"}>Úvěr {i + 1}</legend>
                {many && (
                  <button type="button" className="loan__remove" onClick={() => removeLoan(l.id)}>
                    <span aria-hidden="true">×</span> Odebrat<span className="sr-only"> úvěr {i + 1}</span>
                  </button>
                )}
                <NumberField
                  label="Zůstatek úvěru"
                  suffix="Kč"
                  value={l.balance}
                  onChange={updateLoan(l.id, "balance", "balance")}
                  error={loanErr(i, "balance")}
                  hint={i === 0 ? "Aktuální nesplacená jistina – najdete ji ve svém bankovnictví nebo na posledním výpisu." : undefined}
                />
                <div className="calc__pair">
                  <NumberField
                    label="Úroková sazba"
                    suffix="% p.a."
                    decimals={2}
                    value={l.rate}
                    onChange={updateLoan(l.id, "rate", "rate")}
                    error={loanErr(i, "rate")}
                  />
                  <NumberField
                    label="Měsíční splátka"
                    suffix="Kč"
                    optional
                    placeholder={
                      result.ok && result.loans[i]?.paymentSource === "calculated"
                        ? formatCZK(result.loans[i].payment).replace(/\s?Kč/, "")
                        : ""
                    }
                    value={l.payment}
                    onChange={updateLoan(l.id, "payment", "payment")}
                    error={loanErr(i, "payment")}
                    hint="Necháte-li prázdné, dopočítáme ji."
                  />
                </div>
                <TermField
                  legend="Zbývající doba splácení"
                  years={l.remY}
                  months={l.remM}
                  onYears={updateLoan(l.id, "remY", "months")}
                  onMonths={updateLoan(l.id, "remM", "months")}
                  error={loanErr(i, "months")}
                />
              </fieldset>
            </Fragment>
          ))}

          {loans.length < MAX_LOANS ? (
            <button type="button" className="loan__add" onClick={addLoan} ref={addBtnRef}>
              <span className="loan__add-icon" aria-hidden="true">+</span>
              Přidat další úvěr
              <span className="loan__add-note">konsolidace více úvěrů do jednoho</span>
            </button>
          ) : (
            <p className="field__hint">Kalkulačka pracuje nejvýše s {MAX_LOANS} úvěry.</p>
          )}
        </div>

        <div className="calc__group" data-reveal data-reveal-delay="1">
          <div className="calc__group-head">
            <span className="calc__step" aria-hidden="true">02</span>
            <h3 className="calc__group-title">Sazba při refinancování / konsolidaci</h3>
          </div>
          <NumberField
            label="Úroková sazba"
            suffix="% p.a."
            decimals={2}
            value={newRate}
            onChange={(x) => { setNewRate(x); touch("newRate"); }}
            error={rateErr}
            hint="Zadejte sazbu, se kterou chcete počítat. Nejde o nabídku konkrétní banky."
          />
          <div className="field">
            <label className="check">
              <input
                type="checkbox"
                checked={sameTerm}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSameTerm(checked);
                  if (!checked) {
                    const longest = Math.max(0, ...loanMonths.map((m) => (typeof m === "number" && Number.isFinite(m) ? m : 0)));
                    setNewY(String(Math.floor(longest / 12)));
                    setNewM(String(longest % 12));
                  }
                }}
              />
              <span>{many ? "Splatnost podle nejdelšího z úvěrů" : "Nová splatnost stejná jako zbývající doba"}</span>
            </label>
          </div>
          {!sameTerm && (
            <TermField
              legend="Nová doba splatnosti"
              years={newY}
              months={newM}
              onYears={(x) => { setNewY(x); touch("newMonths"); }}
              onMonths={(x) => { setNewM(x); touch("newMonths"); }}
              error={termErr}
            />
          )}
        </div>
      </form>

      <Results result={result.ok ? result : null} many={many} />

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div className="calc__cta" data-reveal>
        <div>
          <h3 className="calc__cta-title">Chci zjistit své možnosti</h3>
          <p className="calc__cta-text">
            Nechte si nezávazně prověřit možnosti refinancování s odborníkem z Imperial Vision.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onRequestContact}>
          Chci zjistit své možnosti
          <Arrow />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function Results({ result, many }: { result: ConsolidationResult | null; many: boolean }) {
  if (!result) {
    return (
      <aside className="results results--empty" aria-label="Výsledek výpočtu">
        <div className="results__body">
          <p className="results__eyebrow">Orientační výsledek</p>
          <p className="results__placeholder">Doplňte nebo opravte údaje vlevo – výsledek se přepočítá automaticky.</p>
        </div>
      </aside>
    );
  }

  const { monthlyDifference: md, totalDifference: td } = result;
  const higher = md < -0.5;
  const extra = td < -0.5;
  const anyCalculated = result.loans.some((l) => l.paymentSource === "calculated");
  const label = many ? "konsolidaci" : "refinancování";

  return (
    <aside className="results" aria-label="Výsledek výpočtu" data-reveal data-reveal-delay="2">
      <div className="results__body">
        <p className="results__eyebrow">Orientační výsledek</p>

        <dl className="results__list results__list--top">
          <Row
            term={many ? "Aktuální měsíční splátky (součet)" : "Aktuální měsíční splátka"}
            note={anyCalculated ? (many ? "u nevyplněných splátek dopočteno" : "dopočteno ze zadaných údajů") : undefined}
            value={<AnimatedCZK value={result.currentPayment} />}
          />
          <Row
            term={`Splátka po ${label}`}
            note={`${formatCZK(result.totalBalance)} · ${formatMonths(result.newMonths)}`}
            value={<AnimatedCZK value={result.newPayment} />}
          />
        </dl>

        <div className="results__hero">
          <div className="results__kpi">
            <p className="results__kpi-label">{higher ? "Měsíčně více o" : "Měsíčně méně o"}</p>
            <p className={`results__kpi-value${higher ? " is-negative" : ""}`}>
              <AnimatedCZK value={Math.abs(md)} offset={100} />
            </p>
          </div>
          <div className="results__kpi">
            <p className="results__kpi-label">{extra ? "Celkově zaplatíte více o" : "Celková úspora"}</p>
            <p className={`results__kpi-value${extra ? " is-negative" : ""}`}>
              <AnimatedCZK value={Math.abs(td)} offset={1000} />
            </p>
          </div>
        </div>

        <dl className="results__list results__list--small">
          <Row term={`Celkem zaplatím na ${many ? "aktuálních úvěrech" : "aktuálním úvěru"}`} value={<AnimatedCZK value={result.currentTotalPaid} />} />
          <Row term={`Celkem zaplatím po ${label}`} value={<AnimatedCZK value={result.newTotalPaid} />} />
        </dl>

        {result.notices.length > 0 && (
          <ul className="notices">
            {result.notices.map((n) => (
              <li key={n.text} className={`notice notice--${n.kind}`}>
                <span className="notice__icon" aria-hidden="true">{n.kind === "warning" ? "!" : "i"}</span>
                <span>
                  <span className="sr-only">{n.kind === "warning" ? "Upozornění: " : "Informace: "}</span>
                  {n.text}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="results__disclaimer">
          Výpočet je orientační a neslouží jako nabídka úvěru. Zadaná sazba není nabídkou konkrétní banky.
          Předpokládá neměnnou sazbu po celou dobu splácení a nezahrnuje poplatky spojené s refinancováním, pojištění
          ani vedení účtu. Částky jsou nominální, bez vlivu inflace.
        </p>
      </div>
    </aside>
  );
}

/** Odkud se počítá při prvním zobrazení (podíl výsledné hodnoty) – ne od nuly. */
const COUNT_FROM = 0.6;

/**
 * Částka v Kč s mikro „counter“ animací:
 *  – pokaždé, když se výsledek objeví na obrazovce, se číslo dopočítá na skutečnou hodnotu –
 *    buď z hodnoty nižší o `offset` Kč (hlavní údaje: měsíčně o 100, celkem o 1 000),
 *    nebo z ~60 % (ostatní řádky),
 *  – při každé další změně vstupů plynule přejde na novou hodnotu.
 * Při prefers-reduced-motion se zobrazuje rovnou výsledná hodnota.
 */
function AnimatedCZK({ value, offset }: { value: number; offset?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isStatic] = useState(() => prefersReducedMotion() || typeof IntersectionObserver === "undefined");
  const startOf = (v: number) => (offset !== undefined ? Math.max(0, v - offset) : Math.round(v * COUNT_FROM));
  const [visible, setVisible] = useState(isStatic);
  const [shown, setShown] = useState(() => (isStatic ? value : startOf(value)));
  const current = useRef(shown);
  const latest = useRef(value);
  latest.current = value;
  const justRevealed = useRef(false);

  // Sledování viditelnosti: po každém návratu do zorného pole se číslo dopočítá
  // znovu. Reset na výchozí hodnotu proběhne, až když číslo úplně zmizí z obrazovky.
  useEffect(() => {
    if (isStatic || !ref.current) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.9) {
          window.clearTimeout(timer);
          // krátká pauza, aby si čtenář všiml, že se číslo „dopočítává“
          timer = window.setTimeout(() => {
            justRevealed.current = true;
            setVisible(true);
          }, offset !== undefined ? 250 : 0);
        } else if (!entry.isIntersecting) {
          window.clearTimeout(timer);
          const start = startOf(latest.current);
          current.current = start;
          setShown(start);
          setVisible(false);
        }
      },
      { threshold: [0, 0.9] },
    );
    io.observe(ref.current);
    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStatic, offset]);

  useEffect(() => {
    if (!visible) {
      // mimo obrazovku jen připravíme výchozí hodnotu pro příští dopočítání
      if (!isStatic) { current.current = startOf(value); setShown(current.current); }
      return;
    }
    const duration = justRevealed.current ? (offset !== undefined ? 1600 : 1200) : 520;
    justRevealed.current = false;
    return tweenNumber(current.current, value, duration, (v) => {
      current.current = v;
      setShown(v);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, visible]);

  return <span ref={ref} className="counter">{formatCZK(shown)}</span>;
}

function Row({ term, value, note }: { term: string; value: ReactNode; note?: string }) {
  return (
    <div className="results__row">
      <dt>
        {term}
        {note && <span className="results__row-note">{note}</span>}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

export function Arrow() {
  return (
    <svg className="btn__icon" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path d="M3 9h11M10 4.5 14.5 9 10 13.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

function buildSummary(input: ConsolidationInput, r: ConsolidationResult): CalculationSummary {
  const out: CalculationSummary = {};
  const many = r.loans.length > 1;
  r.loans.forEach((l, i) => {
    const k = (label: string) => (many ? `Úvěr ${i + 1} – ${label}` : label.charAt(0).toUpperCase() + label.slice(1));
    out[k("zůstatek")] = formatCZK(l.balance);
    out[k("sazba")] = formatPercent(l.rate);
    out[k("splátka")] = `${formatCZK(l.payment)}${l.paymentSource === "calculated" ? " (dopočtená)" : ""}`;
    out[k("zbývající doba")] = formatMonths(input.loans[i].months ?? l.months);
  });
  out["Sazba při refinancování / konsolidaci"] = formatPercent(input.newRate ?? 0);
  out["Nová splatnost"] = formatMonths(r.newMonths);
  out["Aktuální splátky celkem"] = formatCZK(r.currentPayment);
  out["Splátka po refinancování"] = formatCZK(r.newPayment);
  out["Měsíční rozdíl"] = formatCZK(r.monthlyDifference);
  out["Celková úspora"] = formatCZK(r.totalDifference);
  out["Celkem na aktuálních úvěrech"] = formatCZK(r.currentTotalPaid);
  out["Celkem po refinancování"] = formatCZK(r.newTotalPaid);
  return out;
}
