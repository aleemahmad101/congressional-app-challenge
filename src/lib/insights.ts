/**
 * Explanations computed from the model — the "why" behind a valuation.
 *
 * Pure functions on top of dcf.ts. Nothing here changes how a value is
 * calculated; it only takes the model apart so the page can say which pieces
 * and which assumptions matter most.
 */

import {
  AGGRESSIVE_GROWTH,
  DISCOUNT_RANGE,
  GROWTH_RANGE,
  TERMINAL_RANGE,
  clamp,
  formatPerShare,
  formatRate,
  runDcf,
  type Assumptions,
  type DcfResult,
  type Financials,
} from './dcf';

/* ------------------------------------------------------- value bridge --- */

export interface ValueBridge {
  /** Five forecast years, in today's dollars. */
  forecastYears: number;
  /** Everything after year five, in today's dollars. */
  beyondForecast: number;
  enterpriseValue: number;
  cash: number;
  debt: number;
  equityValue: number;
  shares: number;
  perShare: number;
  /** Share of the business's value that comes from after year five (0-1). */
  beyondShare: number;
}

export function valueBridge(financials: Financials, result: DcfResult): ValueBridge {
  return {
    forecastYears: result.sumPresentValues,
    beyondForecast: result.terminal.presentValue,
    enterpriseValue: result.enterpriseValue,
    cash: financials.cash,
    debt: financials.debt,
    equityValue: result.equityValue,
    shares: financials.sharesOutstanding,
    perShare: result.fairValuePerShare,
    beyondShare: result.enterpriseValue > 0 ? result.terminal.presentValue / result.enterpriseValue : 0,
  };
}

/* ------------------------------------------------------------ drivers --- */

export type AssumptionKey = keyof Assumptions;

export const ASSUMPTION_NAMES: Record<AssumptionKey, string> = {
  growthRate: 'Cash-flow growth',
  discountRate: 'Discount rate',
  terminalGrowth: 'Long-term growth',
};

export interface Driver {
  key: AssumptionKey;
  from: number;
  to: number;
  /**
   * Per-share value now, minus per-share value with only this assumption put
   * back to its starting point. Positive means this change raised the estimate.
   */
  effect: number;
}

/**
 * Which of the visitor's changes moved the estimate, and by how much. Each
 * assumption is tested by putting it alone back to where it started.
 * Unchanged assumptions are left out; the biggest effect comes first.
 */
export function assumptionDrivers(
  financials: Financials,
  start: Assumptions,
  current: Assumptions,
): Driver[] {
  const now = runDcf(financials, current).fairValuePerShare;
  const keys: AssumptionKey[] = ['growthRate', 'discountRate', 'terminalGrowth'];
  return keys
    .filter((key) => Math.abs(current[key] - start[key]) > 1e-9)
    .map((key) => ({
      key,
      from: start[key],
      to: current[key],
      effect: now - runDcf(financials, { ...current, [key]: start[key] }).fairValuePerShare,
    }))
    .filter((d) => Number.isFinite(d.effect))
    .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));
}

/** One sentence per driver, in plain English. */
export function describeDriver(driver: Driver): string {
  const rose = driver.to > driver.from;
  const amount = formatPerShare(Math.abs(driver.effect));
  const movedUp = driver.effect >= 0;
  const result = `${movedUp ? 'raised' : 'lowered'} the estimate by ${amount} a share`;
  const fromTo = `${formatRate(driver.to)} (from ${formatRate(driver.from)})`;

  switch (driver.key) {
    case 'growthRate':
      return rose
        ? `Expecting faster cash-flow growth — ${fromTo} — ${result}.`
        : `Expecting slower cash-flow growth — ${fromTo} — ${result}.`;
    case 'discountRate':
      return rose
        ? `Your higher discount rate, ${fromTo}, makes future cash worth less today. It ${result}.`
        : `Your lower discount rate, ${fromTo}, makes future cash worth more today. It ${result}.`;
    case 'terminalGrowth':
      return `Changing long-term growth after year five to ${fromTo} ${result}.`;
  }
}

/* ------------------------------------------------------- elasticities --- */

export interface Elasticity {
  key: AssumptionKey;
  /** Size of the nudge, as a decimal (0.01 = one percentage point). */
  step: number;
  /** Change in per-share value from that nudge upward. */
  perShare: number;
}

/**
 * How much one small nudge to each assumption moves the answer, from where
 * the visitor is now. Shown when nothing has been changed yet, so there is
 * still a "why" to read.
 */
export function elasticities(financials: Financials, current: Assumptions): Elasticity[] {
  const base = runDcf(financials, current).fairValuePerShare;
  const nudge = (key: AssumptionKey, step: number, range: { min: number; max: number }) => {
    const up = clamp(current[key] + step, range.min, range.max);
    const actual = up - current[key];
    if (actual <= 0) return null;
    const value = runDcf(financials, { ...current, [key]: up }).fairValuePerShare;
    return { key, step: actual, perShare: value - base };
  };
  return [
    nudge('growthRate', 0.01, GROWTH_RANGE),
    nudge('discountRate', 0.01, DISCOUNT_RANGE),
    nudge('terminalGrowth', 0.005, TERMINAL_RANGE),
  ].filter((e): e is Elasticity => e !== null && Number.isFinite(e.perShare));
}

/* ------------------------------------------------------------ warnings --- */

export interface AssumptionWarning {
  key: AssumptionKey;
  message: string;
}

/**
 * Gentle guardrails. They never block a value — experimenting is the point —
 * but they say when an assumption has left the range most analysts would use.
 */
export function assumptionWarnings(
  assumptions: Assumptions,
  historicalFcfGrowth: number | null = null,
): AssumptionWarning[] {
  const warnings: AssumptionWarning[] = [];
  const { growthRate, discountRate, terminalGrowth } = assumptions;

  if (growthRate > AGGRESSIVE_GROWTH) {
    warnings.push({
      key: 'growthRate',
      message: `Growing cash ${formatRate(growthRate)} a year for five straight years is rare, even for fast-growing companies.`,
    });
  } else if (historicalFcfGrowth !== null && growthRate - historicalFcfGrowth > 0.08) {
    warnings.push({
      key: 'growthRate',
      message: `That is well above the ${formatRate(Math.round(historicalFcfGrowth * 1000) / 1000)} a year its cash flow has grown recently. Possible — but you are betting on a change.`,
    });
  }

  if (discountRate < 0.07) {
    warnings.push({
      key: 'discountRate',
      message: 'A required return this low treats the company almost like a government bond. Most analysts use 8–11% for large, established companies.',
    });
  } else if (discountRate > 0.13) {
    warnings.push({
      key: 'discountRate',
      message: 'A demanding return — reasonable for a risky business, strict for a steady one.',
    });
  }

  if (terminalGrowth > 0.03) {
    warnings.push({
      key: 'terminalGrowth',
      message: 'Above about 3% forever, a company would eventually outgrow the whole economy.',
    });
  }

  return warnings;
}
