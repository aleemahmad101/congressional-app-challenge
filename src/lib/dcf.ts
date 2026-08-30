/**
 * ClearValue — Discounted Cash Flow engine.
 *
 * Every export here is a pure function. No React, no DOM, no I/O.
 * The UI is allowed to be pretty; this file is only allowed to be right.
 */

/** Years of explicit projection before the terminal value takes over. */
export const PROJECTION_YEARS = 5;

/**
 * The discount rate must stay at least this far above terminal growth.
 * Below this the Gordon growth denominator collapses and fair value
 * explodes toward infinity — mathematically valid, economically nonsense.
 */
export const MIN_TERMINAL_SPREAD = 0.015;

export const GROWTH_RANGE = { min: 0, max: 0.2, step: 0.005 } as const;
export const DISCOUNT_RANGE = { min: 0.06, max: 0.15, step: 0.0025 } as const;
export const TERMINAL_RANGE = { min: 0.01, max: 0.035, step: 0.0025 } as const;

export const DEFAULT_DISCOUNT_RATE = 0.09;
export const DEFAULT_TERMINAL_GROWTH = 0.025;

/** Above this growth assumption the verdict adds an "aggressive" caveat. */
export const AGGRESSIVE_GROWTH = 0.15;

export interface Financials {
  /** Most recent annual free cash flow, in USD. */
  fcf0: number;
  sharesOutstanding: number;
  /** Cash and equivalents, in USD. */
  cash: number;
  /** Total debt, in USD. */
  debt: number;
  /** Snapshot share price, in USD. */
  currentPrice: number;
}

export interface Assumptions {
  /** FCF growth for years 1-5, as a decimal (0.08 = 8%). */
  growthRate: number;
  /** Annual discount rate, as a decimal. */
  discountRate: number;
  /** Perpetual growth after year 5, as a decimal. */
  terminalGrowth: number;
}

export interface YearProjection {
  year: number;
  /** Projected free cash flow in that year, undiscounted. */
  fcf: number;
  /** 1 / (1 + r)^t */
  discountFactor: number;
  /** What that year's cash is worth today. */
  presentValue: number;
}

export interface TerminalProjection {
  /** Gordon growth value as of the end of year 5. */
  value: number;
  discountFactor: number;
  presentValue: number;
}

export interface DcfResult {
  years: YearProjection[];
  terminal: TerminalProjection;
  /** Sum of the five discounted years. */
  sumPresentValues: number;
  enterpriseValue: number;
  equityValue: number;
  fairValuePerShare: number;
  currentPrice: number;
  /** (fair - price) / price. Null when price is not positive. */
  upside: number | null;
  /** The terminal growth actually used, after the spread guardrail. */
  effectiveTerminalGrowth: number;
  /** True when the guardrail had to pull terminal growth down. */
  terminalGrowthClamped: boolean;
}

/* ---------------------------------------------------------------- math --- */

/**
 * Pull terminal growth down if it crowds the discount rate.
 * Returns the rate we can safely use.
 */
export function clampTerminalGrowth(discountRate: number, terminalGrowth: number): number {
  const ceiling = discountRate - MIN_TERMINAL_SPREAD;
  return Math.min(terminalGrowth, ceiling);
}

/** Project years 1..5 of free cash flow and discount each back to today. */
export function projectYears(
  fcf0: number,
  growthRate: number,
  discountRate: number,
): YearProjection[] {
  const years: YearProjection[] = [];
  for (let year = 1; year <= PROJECTION_YEARS; year++) {
    const fcf = fcf0 * Math.pow(1 + growthRate, year);
    const discountFactor = 1 / Math.pow(1 + discountRate, year);
    years.push({ year, fcf, discountFactor, presentValue: fcf * discountFactor });
  }
  return years;
}

/**
 * Gordon growth terminal value at the end of year 5, discounted to today.
 * Assumes `terminalGrowth` has already cleared the spread guardrail.
 */
export function terminalValue(
  finalYearFcf: number,
  discountRate: number,
  terminalGrowth: number,
): TerminalProjection {
  const value = (finalYearFcf * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  const discountFactor = 1 / Math.pow(1 + discountRate, PROJECTION_YEARS);
  return { value, discountFactor, presentValue: value * discountFactor };
}

/** The whole model, start to finish. */
export function runDcf(financials: Financials, assumptions: Assumptions): DcfResult {
  const { fcf0, sharesOutstanding, cash, debt, currentPrice } = financials;
  const { growthRate, discountRate } = assumptions;

  const effectiveTerminalGrowth = clampTerminalGrowth(discountRate, assumptions.terminalGrowth);
  const terminalGrowthClamped = effectiveTerminalGrowth < assumptions.terminalGrowth;

  const years = projectYears(fcf0, growthRate, discountRate);
  const terminal = terminalValue(
    years[years.length - 1].fcf,
    discountRate,
    effectiveTerminalGrowth,
  );

  const sumPresentValues = years.reduce((total, y) => total + y.presentValue, 0);
  const enterpriseValue = sumPresentValues + terminal.presentValue;
  const equityValue = enterpriseValue + cash - debt;
  const fairValuePerShare = equityValue / sharesOutstanding;

  const upside = currentPrice > 0 ? (fairValuePerShare - currentPrice) / currentPrice : null;

  return {
    years,
    terminal,
    sumPresentValues,
    enterpriseValue,
    equityValue,
    fairValuePerShare,
    currentPrice,
    upside,
    effectiveTerminalGrowth,
    terminalGrowthClamped,
  };
}

/* ------------------------------------------------------------ viability --- */

export type ViabilityProblem =
  | 'negative-fcf'
  | 'shares-not-positive'
  | 'price-not-positive'
  | 'cash-negative'
  | 'debt-negative';

/**
 * Which inputs make the model meaningless. The UI shows a friendly explainer
 * for each of these rather than rendering a broken number.
 */
export function findProblems(financials: Partial<Financials>): ViabilityProblem[] {
  const problems: ViabilityProblem[] = [];
  const { fcf0, sharesOutstanding, cash, debt, currentPrice } = financials;
  if (typeof fcf0 === 'number' && fcf0 <= 0) problems.push('negative-fcf');
  if (typeof sharesOutstanding === 'number' && sharesOutstanding <= 0)
    problems.push('shares-not-positive');
  if (typeof currentPrice === 'number' && currentPrice <= 0) problems.push('price-not-positive');
  if (typeof cash === 'number' && cash < 0) problems.push('cash-negative');
  if (typeof debt === 'number' && debt < 0) problems.push('debt-negative');
  return problems;
}

/* ------------------------------------------------------------- verdicts --- */

export type VerdictTier = 'undervalued' | 'fair' | 'overvalued';

export interface Verdict {
  tier: VerdictTier;
  headline: string;
  body: string;
  /** The closing invitation to move a slider. */
  nudge: string;
}

export const UPSIDE_BAND = 0.2;

export function verdictTier(upside: number): VerdictTier {
  if (upside > UPSIDE_BAND) return 'undervalued';
  if (upside < -UPSIDE_BAND) return 'overvalued';
  return 'fair';
}

export function verdictFor(upside: number): Verdict {
  const tier = verdictTier(upside);
  if (tier === 'undervalued') {
    return {
      tier,
      headline: 'Our estimate is well above today’s price.',
      body: 'The market may be underrating how much cash this company will bring in — or our growth assumption may be too optimistic.',
      nudge: 'Try lowering the growth slider and see what happens.',
    };
  }
  if (tier === 'overvalued') {
    return {
      tier,
      headline: 'Today’s price is well above our estimate.',
      body: 'Investors are betting on faster growth than our assumptions allow for.',
      nudge: 'Drag the growth slider up to see what the market seems to believe.',
    };
  }
  return {
    tier,
    headline: 'Our estimate is close to today’s price.',
    body: 'The market’s expectations and ours roughly agree on what this company’s future cash is worth.',
    nudge: 'Nudge either slider to see how quickly that agreement falls apart.',
  };
}

/* ---------------------------------------------------------- sensitivity --- */

export interface SensitivityCell {
  growthRate: number;
  discountRate: number;
  fairValuePerShare: number;
  /** True for the cell matching the assumptions currently on screen. */
  selected: boolean;
}

/**
 * A 3x3 grid of fair values around the current assumptions: growth across
 * columns, discount rate down rows. Steps stay inside the slider ranges.
 */
export function sensitivityGrid(
  financials: Financials,
  assumptions: Assumptions,
  growthStep = 0.02,
  discountStep = 0.01,
): SensitivityCell[][] {
  const growths = [-1, 0, 1].map((i) =>
    clamp(assumptions.growthRate + i * growthStep, GROWTH_RANGE.min, GROWTH_RANGE.max),
  );
  const discounts = [-1, 0, 1].map((i) =>
    clamp(assumptions.discountRate + i * discountStep, DISCOUNT_RANGE.min, DISCOUNT_RANGE.max),
  );

  return discounts.map((discountRate) =>
    growths.map((growthRate) => ({
      growthRate,
      discountRate,
      fairValuePerShare: runDcf(financials, { ...assumptions, growthRate, discountRate })
        .fairValuePerShare,
      selected:
        nearly(growthRate, assumptions.growthRate) && nearly(discountRate, assumptions.discountRate),
    })),
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function nearly(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9;
}

/* ----------------------------------------------------------- formatting --- */

const UNITS = [
  { threshold: 1e12, suffix: 'T' },
  { threshold: 1e9, suffix: 'B' },
  { threshold: 1e6, suffix: 'M' },
] as const;

/**
 * Big-money formatting: "$2.41B", "-$980.0M", "$412,000".
 * Two decimals from a billion up, one at millions, none below.
 */
export function formatBig(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  for (const { threshold, suffix } of UNITS) {
    if (abs >= threshold) {
      const decimals = threshold >= 1e9 ? 2 : 1;
      return `${sign}$${(abs / threshold).toFixed(decimals)}${suffix}`;
    }
  }
  return `${sign}$${Math.round(abs).toLocaleString('en-US')}`;
}

/** Per-share money, always to the cent: "$187.42". */
export function formatPerShare(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** A rate as a percentage: formatPercent(0.0925) === "9.3%". */
export function formatPercent(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(decimals)}%`;
}

/** A signed delta for the verdict pill: "+23.4%", "-12.1%". */
export function formatDelta(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${(Math.abs(value) * 100).toFixed(decimals)}%`;
}

/** Trims trailing zeros so 9.00% reads as "9%" and 9.25% stays "9.25%". */
export function formatRate(value: number): string {
  const pct = value * 100;
  const text = pct.toFixed(2).replace(/\.?0+$/, '');
  return `${text}%`;
}

/** Share counts use the same magnitude suffixes without the dollar sign. */
export function formatShareCount(value: number): string {
  return formatBig(value).replace('$', '');
}
