/**
 * The page's address is its state: which company is open and which
 * assumptions are set. That makes refresh, the back button and shared links
 * all land where the visitor was.
 *
 *   ?company=nke&g=0.06&r=0.09&t=0.025
 *   ?entry=manual&for=tsla
 *
 * Query parameters rather than paths, so the static GitHub Pages build needs
 * no server-side routing. Pure functions; anything malformed is ignored.
 */

import { DISCOUNT_RANGE, GROWTH_RANGE, TERMINAL_RANGE, clamp, type Assumptions } from './dcf';

export interface Route {
  /** Company id, e.g. "nke". */
  company?: string;
  /** The enter-your-own-figures form. */
  manual?: boolean;
  /** Company the hand-entered figures belong to, if any. */
  forCompany?: string;
  assumptions?: Partial<Assumptions>;
}

const RATE_PARAMS = [
  ['g', 'growthRate', GROWTH_RANGE],
  ['r', 'discountRate', DISCOUNT_RANGE],
  ['t', 'terminalGrowth', TERMINAL_RANGE],
] as const;

const ID = /^[a-z0-9-]{1,12}$/;

/** Rates are kept to a hundredth of a percentage point. */
function tidy(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function parseRoute(search: string): Route {
  const params = new URLSearchParams(search);
  const route: Route = {};

  const company = params.get('company')?.toLowerCase();
  if (company && ID.test(company)) route.company = company;

  if (params.get('entry') === 'manual') {
    route.manual = true;
    const forCompany = params.get('for')?.toLowerCase();
    if (forCompany && ID.test(forCompany)) route.forCompany = forCompany;
  }

  const assumptions: Partial<Assumptions> = {};
  for (const [param, key, range] of RATE_PARAMS) {
    const raw = params.get(param);
    if (raw === null || raw.trim() === '') continue;
    const value = Number(raw);
    if (Number.isFinite(value)) assumptions[key] = tidy(clamp(value, range.min, range.max));
  }
  if (Object.keys(assumptions).length > 0) route.assumptions = assumptions;

  return route;
}

export function buildSearch(route: Route): string {
  const params = new URLSearchParams();
  if (route.manual) {
    params.set('entry', 'manual');
    if (route.forCompany) params.set('for', route.forCompany);
  } else if (route.company) {
    params.set('company', route.company);
    for (const [param, key] of RATE_PARAMS) {
      const value = route.assumptions?.[key];
      if (value !== undefined && Number.isFinite(value)) params.set(param, String(tidy(value)));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}
