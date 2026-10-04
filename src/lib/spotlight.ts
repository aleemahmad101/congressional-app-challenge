/**
 * Questions about the bundle as a whole, rather than one company.
 *
 * Are the current assumptions strict enough that almost everything reads
 * expensive? If so the app says so out loud, because that is the discount rate
 * talking, not a glitch. Also: which company should we put in front of a
 * first-time visitor when nothing else is suggested?
 *
 * Only companies the model can value, and that have a recorded share price,
 * take part — there is nothing to call "expensive" without a price.
 */

import {
  DEFAULT_DISCOUNT_RATE,
  DEFAULT_TERMINAL_GROWTH,
  UPSIDE_BAND,
  runDcf,
  type Assumptions,
} from './dcf';
import { READY_COMPANIES, type Company } from '../data/companies';

/** The assumptions a company is first shown with: its own growth, our rates. */
export function openingAssumptions(company: Company): Assumptions {
  return {
    growthRate: company.startingGrowth.value,
    discountRate: DEFAULT_DISCOUNT_RATE,
    terminalGrowth: DEFAULT_TERMINAL_GROWTH,
  };
}

/** A company's upside at the assumptions it would open with. Null if unpriced. */
export function openingUpside(company: Company): number | null {
  if (!company.financials) return null;
  return runDcf(company.financials, openingAssumptions(company)).upside;
}

/**
 * The bundle sorted by how close each company lands to a neutral verdict.
 * Companies we cannot price fall to the back rather than being dropped.
 */
export function rankByNeutrality(companies: readonly Company[] = READY_COMPANIES): Company[] {
  return [...companies].sort((a, b) => {
    const ua = openingUpside(a);
    const ub = openingUpside(b);
    if (ua === null && ub === null) return 0;
    if (ua === null) return 1;
    if (ub === null) return -1;
    return Math.abs(ua) - Math.abs(ub);
  });
}

export function suggestedCompanies(
  count = 3,
  companies: readonly Company[] = READY_COMPANIES,
): Company[] {
  return rankByNeutrality(companies).slice(0, count);
}

export function neutralCompany(companies: readonly Company[] = READY_COMPANIES): Company | null {
  return rankByNeutrality(companies)[0] ?? null;
}

/**
 * The share of priced companies reading below the negative band at these
 * rates (each at its own starting growth), as a fraction from 0 to 1.
 */
export function shareReadingExpensive(
  assumptions: Assumptions,
  companies: readonly Company[] = READY_COMPANIES,
): number {
  const priced = companies.filter((c) => c.financials && c.financials.currentPrice !== null);
  if (priced.length === 0) return 0;
  const expensive = priced.filter((company) => {
    const upside = runDcf(company.financials!, {
      ...assumptions,
      growthRate: company.startingGrowth.value,
    }).upside;
    return upside !== null && upside < -UPSIDE_BAND;
  }).length;
  return expensive / priced.length;
}

/** Above this share, the app explains itself rather than looking broken. */
export const STRICT_ASSUMPTION_THRESHOLD = 0.7;

export function assumptionsAreStrict(
  assumptions: Assumptions,
  companies: readonly Company[] = READY_COMPANIES,
): boolean {
  return shareReadingExpensive(assumptions, companies) >= STRICT_ASSUMPTION_THRESHOLD;
}
