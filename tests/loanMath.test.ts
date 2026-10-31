import { test } from "node:test";
import assert from "node:assert/strict";
import {
  annuityPayment,
  amortize,
  compareRefinance,
  formatMonths,
  monthsToRepay,
  monthsUntil,
  type RefinanceInput,
} from "../src/lib/loanMath.ts";
import { formatCZK, formatSignedCZK, parseNumber } from "../src/lib/format.ts";

const close = (a: number, b: number, tol = 0.01) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b} (tol ${tol})`);

const base: RefinanceInput = {
  balance: 3_000_000,
  currentRate: 5.89,
  currentPayment: null,
  remainingMonths: 300,
  fixationMonthsLeft: 0,
  newRate: 4.69,
  newMonths: 300,
  fees: 0,
};

test("anuita – referenční hodnoty", () => {
  // 1 000 000 Kč, 5 % p.a., 20 let → 6 599,56 Kč (standardní tabulková hodnota)
  close(annuityPayment(1_000_000, 5, 240), 6599.5574, 0.001);
  // 3 500 000 Kč, 4,99 %, 30 let → 18 767 Kč (shoda s příkladem na hyponamiru.cz)
  close(annuityPayment(3_500_000, 4.99, 360), 18767.4, 0.5);
  // 100 000 Kč, 12 %, 12 měsíců → 8 884,88 Kč
  close(annuityPayment(100_000, 12, 12), 8884.88, 0.01);
});

test("anuita – nulová sazba = lineární dělení", () => {
  assert.equal(annuityPayment(1_200_000, 0, 120), 10_000);
});

test("anuita – neplatné vstupy vrací NaN", () => {
  assert.ok(Number.isNaN(annuityPayment(0, 5, 100)));
  assert.ok(Number.isNaN(annuityPayment(100_000, -1, 100)));
  assert.ok(Number.isNaN(annuityPayment(100_000, 5, 0)));
  assert.ok(Number.isNaN(annuityPayment(100_000, NaN, 10)));
});

test("splátkový kalendář sedí s anuitním vzorcem", () => {
  const M = annuityPayment(2_000_000, 4.5, 240);
  const s = amortize(2_000_000, 4.5, M)!;
  assert.equal(s.months, 240);
  close(s.totalPaid, M * 240, 0.05);
  close(s.totalInterest, M * 240 - 2_000_000, 0.05);
});

test("splátkový kalendář – splátka nepokrývá úrok", () => {
  assert.equal(amortize(1_000_000, 6, 5_000), null); // úrok 5 000 Kč
  assert.equal(monthsToRepay(1_000_000, 6, 4_000), Infinity);
});

test("monthsToRepay je inverzí anuity", () => {
  const M = annuityPayment(1_500_000, 3.9, 180);
  close(monthsToRepay(1_500_000, 3.9, M), 180, 1e-6);
  close(monthsToRepay(120_000, 0, 1_000), 120, 1e-9);
});

test("porovnání – nižší sazba, stejná doba → úspora", () => {
  const r = compareRefinance(base);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.current.paymentSource, "calculated");
  close(r.current.payment, annuityPayment(3_000_000, 5.89, 300), 1e-6);
  close(r.proposed.payment, annuityPayment(3_000_000, 4.69, 300), 1e-6);
  assert.ok(r.monthlyDifference > 0);
  close(r.totalDifference, r.monthlyDifference * 300, 0.01);
  assert.equal(r.breakEvenMonths, null);
});

test("porovnání – poplatky snižují celkovou úsporu a počítá se návratnost", () => {
  const r = compareRefinance({ ...base, fees: 50_000 });
  assert.ok(r.ok);
  if (!r.ok) return;
  close(r.totalDifference, r.monthlyDifference * 300 - 50_000, 0.01);
  assert.equal(r.breakEvenMonths, Math.ceil(50_000 / r.monthlyDifference));
});

test("porovnání – delší splatnost: nižší splátka, ale vyšší celkové náklady", () => {
  const r = compareRefinance({ ...base, newRate: 5.5, newMonths: 420 });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.ok(r.monthlyDifference > 0, "splátka má klesnout");
  assert.ok(r.totalDifference < 0, "celkově má vyjít dráž");
  assert.ok(r.notices.some((n) => n.text.includes("dráž")));
});

test("porovnání – nulové sazby", () => {
  const r = compareRefinance({ ...base, currentRate: 0, newRate: 0 });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.current.payment, 10_000);
  assert.equal(r.proposed.payment, 10_000);
  close(r.totalDifference, 0, 1e-6);
});

test("porovnání – zadaná nekonzistentní splátka → upozornění a výpočet se zadanou splátkou", () => {
  const r = compareRefinance({ ...base, currentPayment: 25_000 });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.current.paymentSource, "entered");
  assert.equal(r.current.payment, 25_000);
  assert.ok(r.current.months < 300);
  assert.ok(r.notices.some((n) => n.kind === "warning" && n.text.includes("neodpovídá")));
});

test("porovnání – konzistentní zadaná splátka → bez upozornění na nesoulad", () => {
  const M = Math.round(annuityPayment(3_000_000, 5.89, 300));
  const r = compareRefinance({ ...base, currentPayment: M });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.ok(!r.notices.some((n) => n.text.includes("neodpovídá")));
  assert.ok(Math.abs(r.current.months - 300) <= 1);
});

test("validace – splátka nepokrývá úrok", () => {
  const r = compareRefinance({ ...base, currentPayment: 10_000 }); // úrok ≈ 14 725 Kč
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.errors.currentPayment!, /úrok/);
});

test("validace – chybějící a mimo rozsah", () => {
  const r = compareRefinance({ ...base, balance: null, currentRate: 45, newMonths: 0, fees: -1, fixationMonthsLeft: -2 });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.balance && r.errors.currentRate && r.errors.newMonths && r.errors.fees && r.errors.fixationMonthsLeft);
});

test("validace – NaN z nečitelného vstupu", () => {
  const r = compareRefinance({ ...base, balance: NaN });
  assert.equal(r.ok, false);
});

test("upozornění na fixaci, pokud nejsou zadány náklady", () => {
  const r = compareRefinance({ ...base, fixationMonthsLeft: 14 });
  assert.ok(r.ok && r.notices.some((n) => n.text.includes("1 rok a 2 měsíce")));
});

test("formátování a parsování v češtině", () => {
  assert.equal(formatCZK(1234567.4).replace(/\s/g, " "), "1 234 567 Kč");
  assert.equal(formatCZK(-0.3).replace(/\s/g, " "), "0 Kč");
  assert.equal(formatSignedCZK(-1500).replace(/\s/g, " "), "− 1 500 Kč");
  assert.equal(parseNumber("3 000 000 Kč"), 3_000_000);
  assert.equal(parseNumber("4,59 %"), 4.59);
  assert.equal(parseNumber(""), null);
  assert.ok(Number.isNaN(parseNumber("abc")));
  assert.ok(Number.isNaN(parseNumber("1,2,3")));
  assert.equal(formatMonths(14), "1 rok a 2 měsíce");
  assert.equal(formatMonths(300), "25 let");
  assert.equal(formatMonths(5), "5 měsíců");
  assert.equal(monthsUntil(2027, 4, new Date(2026, 9, 31)), 6);
});

/* --- konsolidace více úvěrů ----------------------------------------------- */
import { compareConsolidation } from "../src/lib/loanMath.ts";

test("konsolidace – jeden úvěr odpovídá jednoduchému refinancování", () => {
  const r = compareConsolidation({
    loans: [{ balance: 3_000_000, rate: 5.89, payment: null, months: 300 }],
    newRate: 4.69,
    newMonths: null,
  });
  assert.ok(r.ok);
  if (!r.ok) return;
  close(r.currentPayment, annuityPayment(3_000_000, 5.89, 300), 1e-6);
  close(r.newPayment, annuityPayment(3_000_000, 4.69, 300), 1e-6);
  close(r.totalDifference, r.monthlyDifference * 300, 0.01);
});

test("konsolidace – dva úvěry: součet splátek a jistin, splatnost dle nejdelšího", () => {
  const r = compareConsolidation({
    loans: [
      { balance: 2_000_000, rate: 5.5, payment: null, months: 240 },
      { balance: 300_000, rate: 9.9, payment: null, months: 60 },
    ],
    newRate: 3.97,
    newMonths: null,
  });
  assert.ok(r.ok);
  if (!r.ok) return;
  close(r.currentPayment, annuityPayment(2_000_000, 5.5, 240) + annuityPayment(300_000, 9.9, 60), 1e-6);
  assert.equal(r.totalBalance, 2_300_000);
  assert.equal(r.newMonths, 240);
  close(r.newPayment, annuityPayment(2_300_000, 3.97, 240), 1e-6);
  close(r.currentTotalPaid, annuityPayment(2_000_000, 5.5, 240) * 240 + annuityPayment(300_000, 9.9, 60) * 60, 0.01);
  close(r.totalDifference, r.currentTotalPaid - r.newTotalPaid, 1e-6);
  // prodloužení krátkého úvěru na 20 let → měsíčně méně, ale je upozornění?
  assert.ok(r.monthlyDifference > 0);
});

test("konsolidace – chyba u druhého úvěru se vrací u správného úvěru", () => {
  const r = compareConsolidation({
    loans: [
      { balance: 1_000_000, rate: 5, payment: null, months: 120 },
      { balance: null, rate: 8, payment: null, months: 60 },
    ],
    newRate: 3.97,
    newMonths: null,
  });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.loans[1].balance);
  assert.equal(Object.keys(r.errors.loans[0]).length, 0);
});
