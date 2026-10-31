import { useId, useState, type ReactNode } from "react";
import { formatForInput, parseNumber } from "../lib/format";

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (raw: string) => void;
  suffix?: string;
  hint?: ReactNode;
  error?: string;
  decimals?: number;
  optional?: boolean;
  placeholder?: string;
  id?: string;
  /** Skryté popisky pro skupinová pole (např. „roky“ v rámci „Doba splácení“). */
  srLabel?: boolean;
  min?: number;
  max?: number;
}

/**
 * Textové pole pro čísla v českém formátu. Při opuštění pole se hodnota
 * přeformátuje (mezery mezi tisíci, desetinná čárka).
 */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
  error,
  decimals = 0,
  optional,
  placeholder,
  id,
  srLabel,
}: NumberFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `f-${autoId}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errId = error ? `${fieldId}-err` : undefined;

  return (
    <div className={`field${error ? " field--invalid" : ""}`}>
      <label htmlFor={fieldId} className={srLabel ? "sr-only" : "field__label"}>
        {label}
        {optional && <span className="field__optional"> (nepovinné)</span>}
      </label>
      <div className="field__control">
        <input
          id={fieldId}
          className="field__input"
          type="text"
          inputMode={decimals > 0 ? "decimal" : "numeric"}
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errId, hintId].filter(Boolean).join(" ") || undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            const n = parseNumber(value);
            if (n !== null && Number.isFinite(n)) onChange(formatForInput(n, decimals));
          }}
        />
        {suffix && (
          <span className="field__suffix" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={errId} className="field__error">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
    </div>
  );
}

interface TermFieldProps {
  legend: string;
  years: string;
  months: string;
  onYears: (v: string) => void;
  onMonths: (v: string) => void;
  error?: string;
  hint?: ReactNode;
}

/** Doba v letech + měsících jako jedna logická skupina (fieldset). */
export function TermField({ legend, years, months, onYears, onMonths, error, hint }: TermFieldProps) {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset className={`field field--group${error ? " field--invalid" : ""}`} aria-describedby={describedBy}>
      <legend className="field__label">{legend}</legend>
      <div className="field__row">
        <div className="field__control">
          <label htmlFor={`${id}-y`} className="sr-only">
            {legend} – roky
          </label>
          <input
            id={`${id}-y`}
            className="field__input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={years}
            aria-invalid={error ? true : undefined}
            onChange={(e) => onYears(e.target.value)}
          />
          <span className="field__suffix" aria-hidden="true">
            let
          </span>
        </div>
        <div className="field__control">
          <label htmlFor={`${id}-m`} className="sr-only">
            {legend} – měsíce
          </label>
          <input
            id={`${id}-m`}
            className="field__input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={months}
            aria-invalid={error ? true : undefined}
            onChange={(e) => onMonths(e.target.value)}
          />
          <span className="field__suffix" aria-hidden="true">
            měs.
          </span>
        </div>
      </div>
      {error && (
        <p id={errId} className="field__error">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
    </fieldset>
  );
}

/** Převod roků + měsíců na měsíce. Prázdné → null, nečitelné → NaN. */
export function termToMonths(years: string, months: string): number | null {
  const y = parseNumber(years);
  const m = parseNumber(months);
  if (y === null && m === null) return null;
  const yy = y ?? 0;
  const mm = m ?? 0;
  if (!Number.isInteger(yy) || !Number.isInteger(mm) || yy < 0 || mm < 0 || mm > 11) return NaN;
  return yy * 12 + mm;
}

/** Hook pro „dotčená“ pole – chyby ukazujeme až po interakci. */
export function useTouched() {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  return {
    touched,
    touch: (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true })),
    touchAll: (keys: string[]) => setTouched(Object.fromEntries(keys.map((k) => [k, true]))),
  };
}
