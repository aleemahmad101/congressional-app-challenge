/**
 * Typo detection for hand-entered company figures.
 *
 * This file knows nothing about any specific company, and it must stay that
 * way. It cannot tell you whether Apple's free cash flow is right — only a
 * filing can do that. What it can catch is the mistake a human actually makes
 * while typing sixty numbers out of ten PDFs:
 *
 *   - an extra or missing zero
 *   - entering "8.4" when the field wants 8_400_000_000
 *   - transposing two fields
 *
 * Those errors are invisible to the type checker and to every unit test,
 * because the result is still a valid number. They show up as *ratios that no
 * real company has* — a price-to-cash-flow multiple of 4,000, a market
 * capitalisation of eleven dollars. That is what this checks.
 *
 * Two levels:
 *   error   — cannot be right for any company; blocks the deploy.
 *   warning — probably a typo, but a genuinely unusual company could trip it.
 *             Printed loudly, does not block.
 */

import type { Financials } from './dcf';

export interface Finding {
  level: 'error' | 'warning';
  field: string;
  message: string;
}

/**
 * Generic bounds. Deliberately wide — the job is catching digit slips, not
 * second-guessing a real filing. Every figure is in whole dollars.
 */
const BOUNDS = {
  /** Below a million dollars of FCF, someone has typed millions or billions. */
  fcf0: { min: 1e6, max: 1e12 },
  sharesOutstanding: { min: 1e5, max: 1e11 },
  cash: { min: 0, max: 2e12 },
  debt: { min: 0, max: 2e12 },
  currentPrice: { min: 0.01, max: 1e5 },
} as const;

/** Market cap outside this is a digit error, not a company. */
const MARKET_CAP = { min: 1e7, max: 2e13 };

/** Price divided by free cash flow. Real large caps live well inside this. */
const PRICE_TO_FCF = { min: 2, max: 150 };

const money = (n: number) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(2)}B`
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(1)}M`
      : `$${n.toLocaleString('en-US')}`;

function checkBound(
  field: keyof typeof BOUNDS,
  value: number,
  findings: Finding[],
): boolean {
  if (!Number.isFinite(value)) {
    findings.push({ level: 'error', field, message: 'is not a finite number.' });
    return false;
  }

  const { min, max } = BOUNDS[field];
  if (value < min) {
    findings.push({
      level: 'warning',
      field,
      message:
        field === 'currentPrice'
          ? `is ${value}, which is below a cent.`
          : `is ${money(value)}, which is suspiciously small. This field wants whole dollars — 8.4 billion is 8_400_000_000, not 8.4.`,
    });
    return false;
  }
  if (value > max) {
    findings.push({
      level: 'warning',
      field,
      message: `is ${money(value)}, which is larger than any real company. Check for an extra zero.`,
    });
    return false;
  }
  return true;
}

/**
 * Audits one company's figures for signs of a typo. Returns an empty array
 * when everything is plausible — which is not the same as correct.
 */
export function auditFigures(f: Financials, defaultGrowth?: number): Finding[] {
  const findings: Finding[] = [];

  // Hard impossibilities first. These block.
  if (f.fcf0 <= 0) {
    findings.push({
      level: 'error',
      field: 'fcf0',
      message: 'must be positive. A company that burns cash cannot be valued this way.',
    });
  }
  if (f.sharesOutstanding <= 0) {
    findings.push({ level: 'error', field: 'sharesOutstanding', message: 'must be positive.' });
  }
  if (f.currentPrice <= 0) {
    findings.push({ level: 'error', field: 'currentPrice', message: 'must be positive.' });
  }
  if (f.cash < 0) {
    findings.push({ level: 'error', field: 'cash', message: 'cannot be negative.' });
  }
  if (f.debt < 0) {
    findings.push({ level: 'error', field: 'debt', message: 'cannot be negative.' });
  }

  // Magnitude checks.
  const okFcf = checkBound('fcf0', f.fcf0, findings);
  const okShares = checkBound('sharesOutstanding', f.sharesOutstanding, findings);
  checkBound('cash', f.cash, findings);
  checkBound('debt', f.debt, findings);
  const okPrice = checkBound('currentPrice', f.currentPrice, findings);

  if (defaultGrowth !== undefined) {
    if (!Number.isFinite(defaultGrowth) || defaultGrowth < 0 || defaultGrowth > 0.2) {
      findings.push({
        level: 'error',
        field: 'defaultGrowth',
        message: `is ${defaultGrowth}, outside the slider's 0–0.2 range. It is a decimal: 6% is 0.06.`,
      });
    } else if (defaultGrowth > 1) {
      findings.push({
        level: 'warning',
        field: 'defaultGrowth',
        message: 'looks like a percentage. It is a decimal: 6% is 0.06, not 6.',
      });
    }
  }

  // Relationships between fields. This is where a single fluffed digit shows
  // up even when every figure looks reasonable on its own.
  if (okPrice && okShares) {
    const marketCap = f.currentPrice * f.sharesOutstanding;
    if (marketCap < MARKET_CAP.min || marketCap > MARKET_CAP.max) {
      findings.push({
        level: 'warning',
        field: 'currentPrice × sharesOutstanding',
        message: `implies a market value of ${money(
          marketCap,
        )}. That is not a real company's size — one of the two has a digit wrong.`,
      });
    } else if (okFcf) {
      const multiple = marketCap / f.fcf0;
      if (multiple < PRICE_TO_FCF.min || multiple > PRICE_TO_FCF.max) {
        findings.push({
          level: 'warning',
          field: 'fcf0 vs market value',
          message: `means the company is priced at ${multiple.toFixed(
            0,
          )}x its free cash flow. Real large caps sit roughly between ${PRICE_TO_FCF.min}x and ${PRICE_TO_FCF.max}x, so check fcf0, currentPrice and sharesOutstanding.`,
        });
      }
    }
  }

  if (okPrice && okShares && f.debt > 0) {
    const marketCap = f.currentPrice * f.sharesOutstanding;
    if (f.debt > marketCap * 20) {
      findings.push({
        level: 'warning',
        field: 'debt',
        message: `is more than twenty times the company's market value (${money(
          marketCap,
        )}). Debt means borrowings only, not total liabilities.`,
      });
    }
  }

  return findings;
}

export function hasErrors(findings: readonly Finding[]): boolean {
  return findings.some((f) => f.level === 'error');
}
