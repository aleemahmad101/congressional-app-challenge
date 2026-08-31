/**
 * Questions about the bundle as a whole, rather than one company.
 *
 * Two of them, both driving things a judge sees in the first ten seconds:
 *
 * 1. Which company should we put in front of a first-time visitor? The one
 *    whose verdict lands nearest the neutral band — opening on a company that
 *    reads "68% overvalued" makes a working app look broken.
 * 2. Are the current assumptions strict enough that almost everything reads
 *    expensive? If so the app says so out loud, because that is the discount
 *    rate talking, not a glitch.
 *
 * Ten companies times six exponentials is nothing; these run inline.
 */

import {
  DEFAULT_DISCOUNT_RATE,
  DEFAULT_TERMINAL_GROWTH,
  UPSIDE_BAND,
  runDcf,
  type Assumptions,
} from './dcf';
import { COMPANIES, type Company } from '../data/companies';

/** The assumptions a company is first shown with: its own growth, our rates. */
export function openingAssumptions(company: Company): Assumptions {
  return {
    growthRate: company.defaultGrowth,
    discountRate: DEFAULT_DISCOUNT_RATE,
    terminalGrowth: DEFAULT_TERMINAL_GROWTH,
  };
}

/** A company's upside at the assumptions it would open with. Null if unpriced. */
export function openingUpside(company: Company): number | null {
  return runDcf(company, openingAssumptions(company)).upside;
}

/**
 * The bundle sorted by how close each company lands to a neutral verdict.
 * Companies we cannot price fall to the back rather than being dropped.
 */
export function rankByNeutrality(companies: readonly Company[] = COMPANIES): Company[] {
  return [...companies].sort((a, b) => {
    const ua = openingUpside(a);
    const ub = openingUpside(b);
    if (ua === null && ub === null) return 0;
    if (ua === null) return 1;
    if (ub === null) return -1;
    return Math.abs(ua) - Math.abs(ub);
  });
}

/**
 * What the empty state offers. The first card is the nearest-to-neutral
 * company — computed, never hardcoded, so it stays correct when the real
 * figures land and the ordering changes.
 */
export function suggestedCompanies(count = 3, companies: readonly Company[] = COMPANIES): Company[] {
  return rankByNeutrality(companies).slice(0, count);
}

/** The company a first-time visitor should be pointed at. */
export function neutralCompany(companies: readonly Company[] = COMPANIES): Company | null {
  return rankByNeutrality(companies)[0] ?? null;
}

/**
 * The share of the bundle reading below the negative band at these
 * assumptions, as a fraction from 0 to 1.
 */
export function shareReadingExpensive(
  assumptions: Assumptions,
  companies: readonly Company[] = COMPANIES,
): number {
  if (companies.length === 0) return 0;
  const expensive = companies.filter((company) => {
    const upside = runDcf(company, { ...assumptions, growthRate: company.defaultGrowth }).upside;
    return upside !== null && upside < -UPSIDE_BAND;
  }).length;
  return expensive / companies.length;
}

/** Above this share, the app explains itself rather than looking broken. */
export const STRICT_ASSUMPTION_THRESHOLD = 0.7;

export function assumptionsAreStrict(
  assumptions: Assumptions,
  companies: readonly Company[] = COMPANIES,
): boolean {
  return shareReadingExpensive(assumptions, companies) >= STRICT_ASSUMPTION_THRESHOLD;
}
