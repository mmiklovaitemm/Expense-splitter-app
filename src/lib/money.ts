// All monetary amounts in this app are integers in "minor units" (cents) to
// avoid floating point drift. These helpers convert to/from major units for
// display and user input only.

export function toMinor(amount: number): number {
  return Math.round(amount * 100);
}

export function toMajor(minor: number): number {
  return minor / 100;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  KRW: "₩",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF ",
  INR: "₹",
};

// Currencies whose smallest unit is 1 (no decimal subdivision), so we store
// them as whole-unit "minor" values rather than x100.
const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND", "CLP"]);

export function isZeroDecimal(currency: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.has(currency);
}

export function toMinorUnits(amount: number, currency: string): number {
  return isZeroDecimal(currency) ? Math.round(amount) : Math.round(amount * 100);
}

export function toMajorUnits(minor: number, currency: string): number {
  return isZeroDecimal(currency) ? minor : minor / 100;
}

// Pinned to a fixed locale (rather than the visitor's) so server-rendered
// and client-rendered markup always match and React never has to discard
// the SSR output for a hydration mismatch.
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatMoney(minor: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const major = toMajorUnits(minor, currency);
  const decimals = isZeroDecimal(currency) ? 0 : 2;
  const sign = major < 0 ? "-" : "";
  const formatted = Math.abs(major).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}${symbol}${formatted}`;
}

export type SplitType = "EQUAL" | "EXACT" | "PERCENT" | "SHARES";

export interface SplitInput {
  memberId: string;
  // EXACT: minor-unit amount; PERCENT: percent (0-100); SHARES: integer share count
  value?: number;
}

export interface ComputedSplit {
  memberId: string;
  amount: number; // minor units, always sums exactly to totalMinor
  percent?: number;
  shares?: number;
}

/**
 * Distributes any leftover cent(s) from a rounding-based split across the
 * first participants in order, so the parts always sum exactly to the total.
 */
function distributeRemainder(
  base: number[],
  totalMinor: number
): number[] {
  const sum = base.reduce((a, b) => a + b, 0);
  let remainder = totalMinor - sum;
  const result = [...base];
  let i = 0;
  while (remainder !== 0 && result.length > 0) {
    const step = remainder > 0 ? 1 : -1;
    result[i % result.length] += step;
    remainder -= step;
    i++;
  }
  return result;
}

export function computeSplits(
  splitType: SplitType,
  totalMinor: number,
  participants: SplitInput[]
): ComputedSplit[] {
  const n = participants.length;
  if (n === 0) return [];

  if (splitType === "EQUAL") {
    const base = Math.floor(totalMinor / n);
    const amounts = distributeRemainder(
      new Array(n).fill(base),
      totalMinor
    );
    return participants.map((p, i) => ({ memberId: p.memberId, amount: amounts[i] }));
  }

  if (splitType === "EXACT") {
    return participants.map((p) => ({ memberId: p.memberId, amount: Math.round(p.value ?? 0) }));
  }

  if (splitType === "PERCENT") {
    const raw = participants.map((p) => (totalMinor * (p.value ?? 0)) / 100);
    const base = raw.map((v) => Math.floor(v));
    const amounts = distributeRemainder(base, totalMinor);
    return participants.map((p, i) => ({
      memberId: p.memberId,
      amount: amounts[i],
      percent: p.value ?? 0,
    }));
  }

  if (splitType === "SHARES") {
    const totalShares = participants.reduce((sum, p) => sum + (p.value ?? 0), 0);
    if (totalShares === 0) return participants.map((p) => ({ memberId: p.memberId, amount: 0, shares: 0 }));
    const raw = participants.map((p) => (totalMinor * (p.value ?? 0)) / totalShares);
    const base = raw.map((v) => Math.floor(v));
    const amounts = distributeRemainder(base, totalMinor);
    return participants.map((p, i) => ({
      memberId: p.memberId,
      amount: amounts[i],
      shares: p.value ?? 0,
    }));
  }

  throw new Error(`Unknown split type: ${splitType}`);
}

export interface SplitValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSplitInputs(
  splitType: SplitType,
  totalMinor: number,
  participants: SplitInput[]
): SplitValidationResult {
  if (participants.length === 0) {
    return { valid: false, error: "Select at least one person to split with." };
  }

  if (splitType === "EXACT") {
    const sum = participants.reduce((s, p) => s + Math.round(p.value ?? 0), 0);
    if (sum !== totalMinor) {
      return {
        valid: false,
        error: `Amounts must add up to the total (currently off by ${(
          (totalMinor - sum) /
          100
        ).toFixed(2)}).`,
      };
    }
  }

  if (splitType === "PERCENT") {
    const sum = participants.reduce((s, p) => s + (p.value ?? 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      return { valid: false, error: `Percentages must add up to 100% (currently ${sum.toFixed(1)}%).` };
    }
  }

  if (splitType === "SHARES") {
    const sum = participants.reduce((s, p) => s + (p.value ?? 0), 0);
    if (sum <= 0) {
      return { valid: false, error: "Enter at least one share." };
    }
  }

  return { valid: true };
}
