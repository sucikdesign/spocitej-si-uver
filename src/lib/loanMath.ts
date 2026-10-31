/**
 * Výpočetní logika kalkulačky refinancování.
 * Čisté funkce bez závislosti na UI – testováno v tests/loanMath.test.ts.
 *
 * Anuitní splátka:  M = P × r / (1 − (1 + r)^−n)
 *   P … jistina (zůstatek), r … měsíční úroková sazba (roční % / 100 / 12),
 *   n … počet zbývajících měsíčních splátek. Pro r = 0 platí M = P / n.
 */

export const LIMITS = {
  balanceMin: 10_000,
  balanceMax: 100_000_000,
  rateMin: 0,
  rateMax: 30,
  monthsMin: 1,
  monthsMax: 480, // 40 let
  feesMax: 10_000_000,
  fixationMonthsMax: 360,
  /** Tolerance mezi zadanou a dopočtenou splátkou, nad kterou upozorníme. */
  paymentTolerance: 0.02,
} as const;

const EPS = 1e-9;

export function monthlyRate(annualRatePct: number): number {
  return annualRatePct / 100 / 12;
}

/** Anuitní měsíční splátka. Vrací NaN pro neplatné vstupy. */
export function annuityPayment(principal: number, annualRatePct: number, months: number): number {
  if (!(principal > 0) || !(months >= 1) || !Number.isFinite(annualRatePct) || annualRatePct < 0) {
    return NaN;
  }
  const n = Math.round(months);
  const r = monthlyRate(annualRatePct);
  if (r < EPS) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/**
 * Kolik splátek je potřeba ke splacení jistiny při dané splátce (neceločíselně).
 * Infinity, pokud splátka nepokryje ani úrok.
 */
export function monthsToRepay(principal: number, annualRatePct: number, payment: number): number {
  if (!(principal > 0) || !(payment > 0)) return NaN;
  const r = monthlyRate(annualRatePct);
  if (r < EPS) return principal / payment;
  if (payment <= principal * r + EPS) return Infinity;
  return -Math.log(1 - (principal * r) / payment) / Math.log(1 + r);
}

export interface AmortizationSummary {
  /** Počet splátek včetně poslední (případně nižší) splátky. */
  months: number;
  totalPaid: number;
  totalInterest: number;
  /** Výše poslední splátky (může být nižší než běžná). */
  lastPayment: number;
}

/**
 * Splátkový kalendář s pevnou splátkou – měsíční připisování úroku,
 * poslední splátka se zkrátí na zbývající dluh. Bez zaokrouhlování
 * mezikroků (zaokrouhluje až prezentace).
 */
export function amortize(
  principal: number,
  annualRatePct: number,
  payment: number,
  maxMonths: number = LIMITS.monthsMax * 2,
): AmortizationSummary | null {
  const r = monthlyRate(annualRatePct);
  if (!(principal > 0) || !(payment > 0)) return null;
  if (r > 0 && payment <= principal * r + EPS) return null;

  let balance = principal;
  let totalPaid = 0;
  let totalInterest = 0;
  let months = 0;
  let lastPayment = 0;

  while (balance > 0.005 && months < maxMonths) {
    const interest = balance * r;
    const due = balance + interest;
    const pay = Math.min(payment, due);
    balance = due - pay;
    totalInterest += interest;
    totalPaid += pay;
    lastPayment = pay;
    months += 1;
  }
  if (balance > 0.005) return null;
  return { months, totalPaid, totalInterest, lastPayment };
}

/* ------------------------------------------------------------------------ */
/* Porovnání současného úvěru a modelového refinancování                     */
/* ------------------------------------------------------------------------ */

export interface RefinanceInput {
  /** Zůstatek současného úvěru v Kč. */
  balance: number | null;
  /** Současná roční úroková sazba v %. */
  currentRate: number | null;
  /** Současná měsíční splátka v Kč (nepovinná – lze dopočítat). */
  currentPayment: number | null;
  /** Zbývající doba splácení v měsících. */
  remainingMonths: number | null;
  /** Měsíce do konce fixace (0 = fixace končí nyní). Nepovinné. */
  fixationMonthsLeft: number | null;
  /** Modelová nová roční úroková sazba v %. */
  newRate: number | null;
  /** Nová doba splatnosti v měsících. */
  newMonths: number | null;
  /** Jednorázové náklady refinancování v Kč (poplatky, odhad, vklad…). */
  fees: number | null;
}

export type FieldKey = keyof RefinanceInput;

export interface Notice {
  kind: "warning" | "info";
  text: string;
}

export interface RefinanceResult {
  ok: true;
  current: {
    payment: number;
    paymentSource: "entered" | "calculated";
    /** Splátka dopočtená z P, r, n (pro kontrolu konzistence). */
    theoreticalPayment: number;
    months: number;
    totalPaid: number;
    totalInterest: number;
  };
  proposed: {
    payment: number;
    months: number;
    totalPaid: number;
    totalInterest: number;
  };
  fees: number;
  /** Současná splátka − nová splátka (kladné = nižší splátka). */
  monthlyDifference: number;
  /** Současné zbývající náklady − (nové náklady + poplatky). Kladné = úspora. */
  totalDifference: number;
  /** Počet měsíců, za které se poplatky vrátí na nižší splátce. */
  breakEvenMonths: number | null;
  fixationMonthsLeft: number | null;
  notices: Notice[];
}

export interface RefinanceInvalid {
  ok: false;
  errors: Partial<Record<FieldKey, string>>;
}

const fmtInt = (v: number) =>
  new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(Math.round(v));

const isNum = (v: number | null): v is number => typeof v === "number" && Number.isFinite(v);

export function validate(input: RefinanceInput): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};
  const { balance, currentRate, currentPayment, remainingMonths, fixationMonthsLeft, newRate, newMonths, fees } = input;

  if (!isNum(balance)) e.balance = "Zadejte zůstatek úvěru.";
  else if (balance < LIMITS.balanceMin) e.balance = `Zůstatek musí být alespoň ${fmtInt(LIMITS.balanceMin)} Kč.`;
  else if (balance > LIMITS.balanceMax) e.balance = `Zůstatek může být nejvýše ${fmtInt(LIMITS.balanceMax)} Kč.`;

  if (!isNum(currentRate)) e.currentRate = "Zadejte současnou úrokovou sazbu.";
  else if (currentRate < LIMITS.rateMin || currentRate > LIMITS.rateMax)
    e.currentRate = `Sazba musí být mezi 0 a ${LIMITS.rateMax} %.`;

  if (!isNum(remainingMonths)) e.remainingMonths = "Zadejte zbývající dobu splácení.";
  else if (remainingMonths < LIMITS.monthsMin || remainingMonths > LIMITS.monthsMax)
    e.remainingMonths = "Zbývající doba musí být od 1 měsíce do 40 let.";

  if (currentPayment !== null) {
    if (!isNum(currentPayment) || currentPayment <= 0) e.currentPayment = "Splátka musí být kladné číslo.";
    else if (isNum(balance) && currentPayment > balance * 1.5)
      e.currentPayment = "Splátka je vyšší než zůstatek úvěru. Zkontrolujte zadání.";
    else if (isNum(balance) && isNum(currentRate) && !e.balance && !e.currentRate) {
      const interest = balance * monthlyRate(currentRate);
      if (currentRate > 0 && currentPayment <= interest)
        e.currentPayment = `Splátka nepokrývá ani měsíční úrok (≈ ${fmtInt(interest)} Kč). Úvěr by se při ní nesplácel.`;
    }
  }

  if (fixationMonthsLeft !== null) {
    if (!isNum(fixationMonthsLeft) || fixationMonthsLeft < 0)
      e.fixationMonthsLeft = "Konec fixace nemůže být v minulosti.";
    else if (fixationMonthsLeft > LIMITS.fixationMonthsMax)
      e.fixationMonthsLeft = "Fixace může skončit nejpozději za 30 let.";
  }

  if (!isNum(newRate)) e.newRate = "Zadejte modelovou úrokovou sazbu.";
  else if (newRate < LIMITS.rateMin || newRate > LIMITS.rateMax)
    e.newRate = `Sazba musí být mezi 0 a ${LIMITS.rateMax} %.`;

  if (!isNum(newMonths)) e.newMonths = "Zadejte novou dobu splatnosti.";
  else if (newMonths < LIMITS.monthsMin || newMonths > LIMITS.monthsMax)
    e.newMonths = "Doba splatnosti musí být od 1 měsíce do 40 let.";

  if (fees !== null) {
    if (!isNum(fees) || fees < 0) e.fees = "Náklady nemohou být záporné.";
    else if (fees > LIMITS.feesMax) e.fees = `Náklady mohou být nejvýše ${fmtInt(LIMITS.feesMax)} Kč.`;
  }
  return e;
}

export function compareRefinance(input: RefinanceInput): RefinanceResult | RefinanceInvalid {
  const errors = validate(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const balance = input.balance as number;
  const currentRate = input.currentRate as number;
  const remaining = Math.round(input.remainingMonths as number);
  const newRate = input.newRate as number;
  const newMonths = Math.round(input.newMonths as number);
  const fees = input.fees ?? 0;
  const notices: Notice[] = [];

  /* --- současný úvěr ---------------------------------------------------- */
  const theoreticalPayment = annuityPayment(balance, currentRate, remaining);
  let currentPayment: number;
  let paymentSource: "entered" | "calculated";
  let currentMonths: number;
  let currentTotalPaid: number;

  if (input.currentPayment !== null) {
    currentPayment = input.currentPayment;
    paymentSource = "entered";
    const schedule = amortize(balance, currentRate, currentPayment);
    if (!schedule) {
      return {
        ok: false,
        errors: { currentPayment: "Při této splátce by úvěr nebyl splacen do 80 let. Zkontrolujte zadání." },
      };
    }
    currentMonths = schedule.months;
    currentTotalPaid = schedule.totalPaid;

    const deviation = Math.abs(currentPayment - theoreticalPayment) / theoreticalPayment;
    if (deviation > LIMITS.paymentTolerance) {
      notices.push({
        kind: "warning",
        text:
          `Zadaná splátka neodpovídá zůstatku, sazbě a zbývající době. Při těchto parametrech by vycházela ` +
          `≈ ${fmtInt(theoreticalPayment)} Kč. Náklady současného úvěru počítáme se zadanou splátkou – ` +
          `úvěr by tak byl splacen za ${formatMonths(currentMonths)} (zadáno ${formatMonths(remaining)}).`,
      });
    }
  } else {
    currentPayment = theoreticalPayment;
    paymentSource = "calculated";
    currentMonths = remaining;
    currentTotalPaid = theoreticalPayment * remaining;
  }

  /* --- modelové refinancování ------------------------------------------ */
  const newPayment = annuityPayment(balance, newRate, newMonths);
  const newTotalPaid = newPayment * newMonths;

  const monthlyDifference = currentPayment - newPayment;
  const totalDifference = currentTotalPaid - (newTotalPaid + fees);

  let breakEvenMonths: number | null = null;
  if (fees > 0 && monthlyDifference > 0) {
    breakEvenMonths = Math.ceil(fees / monthlyDifference);
  }

  /* --- doplňující upozornění ------------------------------------------- */
  if (newMonths > currentMonths) {
    notices.push({
      kind: "info",
      text:
        "Nová doba splatnosti je delší než současná. Nižší měsíční splátka pak nemusí znamenat nižší celkové náklady.",
    });
  }
  if (monthlyDifference > 0 && totalDifference < 0) {
    notices.push({
      kind: "warning",
      text: "Měsíčně byste platili méně, ale za celou dobu splácení by úvěr vyšel dráž.",
    });
  }
  if (breakEvenMonths !== null && breakEvenMonths > newMonths) {
    notices.push({
      kind: "warning",
      text: "Úspora na splátkách nepokryje zadané náklady refinancování během celé doby splatnosti.",
    });
  }
  if (newRate >= currentRate && newMonths >= currentMonths) {
    notices.push({
      kind: "info",
      text: "Modelová sazba není nižší než současná – refinancování by při těchto parametrech nepřineslo úsporu.",
    });
  }
  const fix = input.fixationMonthsLeft;
  if (fix !== null && fix > 0 && fees === 0) {
    notices.push({
      kind: "info",
      text:
        `Do konce fixace zbývá ${formatMonths(fix)}. Při splacení před koncem fixace může věřitel požadovat ` +
        `náhradu nákladů spojených s předčasným splacením – zahrňte ji do nákladů refinancování.`,
    });
  }

  return {
    ok: true,
    current: {
      payment: currentPayment,
      paymentSource,
      theoreticalPayment,
      months: currentMonths,
      totalPaid: currentTotalPaid,
      totalInterest: currentTotalPaid - balance,
    },
    proposed: {
      payment: newPayment,
      months: newMonths,
      totalPaid: newTotalPaid,
      totalInterest: newTotalPaid - balance,
    },
    fees,
    monthlyDifference,
    totalDifference,
    breakEvenMonths,
    fixationMonthsLeft: fix,
    notices,
  };
}

/* ------------------------------------------------------------------------ */
/* Pomocné funkce                                                           */
/* ------------------------------------------------------------------------ */

/** Český zápis počtu měsíců: „2 roky a 3 měsíce“, „11 měsíců“, „25 let“. */
export function formatMonths(total: number): string {
  const m = Math.max(0, Math.round(total));
  const years = Math.floor(m / 12);
  const months = m % 12;
  const y = years === 0 ? "" : `${years} ${plural(years, "rok", "roky", "let")}`;
  const mo = months === 0 ? "" : `${months} ${plural(months, "měsíc", "měsíce", "měsíců")}`;
  if (y && mo) return `${y} a ${mo}`;
  return y || mo || "0 měsíců";
}

export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  if (abs === 1) return one;
  if (abs >= 2 && abs <= 4) return few;
  return many;
}

/** Počet celých měsíců od data `from` do konce měsíce `year-month` (1–12). */
export function monthsUntil(year: number, month: number, from: Date = new Date()): number {
  return (year - from.getFullYear()) * 12 + (month - (from.getMonth() + 1));
}

/* ------------------------------------------------------------------------ */
/* Refinancování / konsolidace více úvěrů                                    */
/* ------------------------------------------------------------------------ */

export interface LoanInput {
  balance: number | null;
  rate: number | null;
  /** Nepovinná – když chybí, dopočítá se anuitou. */
  payment: number | null;
  months: number | null;
}

export interface ConsolidationInput {
  loans: LoanInput[];
  newRate: number | null;
  /** Nová splatnost v měsících; null = podle nejdelší zbývající doby. */
  newMonths: number | null;
}

export type LoanField = "balance" | "rate" | "payment" | "months";
export interface ConsolidationErrors {
  loans: Partial<Record<LoanField, string>>[];
  newRate?: string;
  newMonths?: string;
}

export interface LoanSummary {
  balance: number;
  rate: number;
  payment: number;
  paymentSource: "entered" | "calculated";
  months: number;
  totalPaid: number;
}

export interface ConsolidationResult {
  ok: true;
  loans: LoanSummary[];
  /** Součet aktuálních měsíčních splátek. */
  currentPayment: number;
  /** Celkem zaplatím na aktuálních úvěrech (součet zbývajících plateb). */
  currentTotalPaid: number;
  totalBalance: number;
  newPayment: number;
  newMonths: number;
  /** Celkem zaplatím po refinancování / konsolidaci. */
  newTotalPaid: number;
  /** Aktuální − nová splátka (kladné = měsíčně méně). */
  monthlyDifference: number;
  /** Celkem aktuálně − celkem nově (kladné = úspora). */
  totalDifference: number;
  notices: Notice[];
}

export interface ConsolidationInvalid {
  ok: false;
  errors: ConsolidationErrors;
}

export function compareConsolidation(input: ConsolidationInput): ConsolidationResult | ConsolidationInvalid {
  const errors: ConsolidationErrors = { loans: input.loans.map(() => ({})) };
  let hasError = false;

  // validace každého úvěru přes stávající logiku (bez fixace a poplatků)
  input.loans.forEach((l, i) => {
    const e = validate({
      balance: l.balance,
      currentRate: l.rate,
      currentPayment: l.payment,
      remainingMonths: l.months,
      fixationMonthsLeft: null,
      newRate: 0,
      newMonths: 12,
      fees: null,
    });
    const le = errors.loans[i];
    if (e.balance) le.balance = e.balance;
    if (e.currentRate) le.rate = e.currentRate;
    if (e.currentPayment) le.payment = e.currentPayment;
    if (e.remainingMonths) le.months = e.remainingMonths;
    if (Object.keys(le).length) hasError = true;
  });

  const newRate = input.newRate;
  if (!isNum(newRate)) { errors.newRate = "Zadejte sazbu, se kterou chcete počítat."; hasError = true; }
  else if (newRate < LIMITS.rateMin || newRate > LIMITS.rateMax) {
    errors.newRate = `Sazba musí být mezi 0 a ${LIMITS.rateMax} %.`; hasError = true;
  }
  if (input.newMonths !== null) {
    if (!isNum(input.newMonths)) { errors.newMonths = "Zadejte novou dobu splatnosti."; hasError = true; }
    else if (input.newMonths < LIMITS.monthsMin || input.newMonths > LIMITS.monthsMax) {
      errors.newMonths = "Doba splatnosti musí být od 1 měsíce do 40 let."; hasError = true;
    }
  }
  if (input.loans.length === 0 || hasError) return { ok: false, errors };

  const notices: Notice[] = [];
  const loans: LoanSummary[] = [];
  for (let i = 0; i < input.loans.length; i++) {
    const l = input.loans[i];
    const balance = l.balance as number;
    const rate = l.rate as number;
    const months = Math.round(l.months as number);
    const theoretical = annuityPayment(balance, rate, months);
    if (l.payment !== null) {
      const schedule = amortize(balance, rate, l.payment);
      if (!schedule) {
        errors.loans[i].payment = "Při této splátce by úvěr nebyl splacen do 80 let. Zkontrolujte zadání.";
        return { ok: false, errors };
      }
      if (Math.abs(l.payment - theoretical) / theoretical > LIMITS.paymentTolerance) {
        notices.push({
          kind: "warning",
          text:
            `${input.loans.length > 1 ? `Úvěr ${i + 1}: z` : "Z"}adaná splátka neodpovídá zůstatku, sazbě a zbývající době ` +
            `(vycházela by ≈ ${fmtInt(theoretical)} Kč). Počítáme se zadanou splátkou – úvěr by byl splacen za ` +
            `${formatMonths(schedule.months)}.`,
        });
      }
      loans.push({ balance, rate, payment: l.payment, paymentSource: "entered", months: schedule.months, totalPaid: schedule.totalPaid });
    } else {
      loans.push({ balance, rate, payment: theoretical, paymentSource: "calculated", months, totalPaid: theoretical * months });
    }
  }

  const totalBalance = loans.reduce((s, l) => s + l.balance, 0);
  const currentPayment = loans.reduce((s, l) => s + l.payment, 0);
  const currentTotalPaid = loans.reduce((s, l) => s + l.totalPaid, 0);
  const longest = Math.max(...loans.map((l) => l.months));
  const newMonths = input.newMonths !== null ? Math.round(input.newMonths) : longest;
  const newPayment = annuityPayment(totalBalance, newRate as number, newMonths);
  const newTotalPaid = newPayment * newMonths;
  const monthlyDifference = currentPayment - newPayment;
  const totalDifference = currentTotalPaid - newTotalPaid;

  if (newMonths > longest) {
    notices.push({
      kind: "info",
      text: "Nová doba splatnosti je delší než současná. Nižší měsíční splátka pak nemusí znamenat nižší celkové náklady.",
    });
  }
  if (monthlyDifference > 0 && totalDifference < 0) {
    notices.push({ kind: "warning", text: "Měsíčně byste platili méně, ale za celou dobu splácení by úvěr vyšel dráž." });
  }
  const weightedRate = loans.reduce((s, l) => s + l.rate * l.balance, 0) / totalBalance;
  if ((newRate as number) >= weightedRate && newMonths >= longest) {
    notices.push({
      kind: "info",
      text: "Sazba při refinancování není nižší než současná – při těchto parametrech by nepřineslo úsporu.",
    });
  }

  return {
    ok: true,
    loans,
    currentPayment,
    currentTotalPaid,
    totalBalance,
    newPayment,
    newMonths,
    newTotalPaid,
    monthlyDifference,
    totalDifference,
    notices,
  };
}
