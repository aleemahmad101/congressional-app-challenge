/**
 * Resolves the catalog into the companies the app renders.
 *
 * For every reported figure the order of trust is:
 *
 *   1. SEC filing data   (src/data/sec-financials.json, via `npm run data:fetch`)
 *   2. Hand-entered      (catalog.ts `hand`, with a recorded source)
 *   3. Sample data       (catalog.ts `hand` while it is still SAMPLE_DATA)
 *   4. Missing           — left missing, and said so on screen
 *
 * A figure is never filled in from anywhere else. Pure functions, so the
 * rules are tested directly in companies.test.ts.
 */

import { GROWTH_RANGE, clamp, type Financials } from '../lib/dcf';
import { filingUrl, type CitedValue, type SecRecord } from '../lib/sec';
import { CATALOG, SAMPLE_DATA } from './catalog';
import secData from './sec-financials.json';
import {
  SECTOR_GROUPS,
  type Company,
  type CompanyProfile,
  type Figure,
  type HistoryPoint,
  type Provenance,
  type ReportedFigures,
  type ReportedKey,
  type SectorGroup,
  type StartingGrowth,
} from './types';

export { SAMPLE_DATA, SECTOR_GROUPS };
export type { Company, SectorGroup };

/** Plain-English names for the figures the model cannot run without. */
export const FIGURE_LABELS: Record<ReportedKey, string> = {
  revenue: 'Revenue',
  operatingIncome: 'Operating income',
  operatingCashFlow: 'Cash from operations',
  capex: 'Capital expenditures',
  freeCashFlow: 'Free cash flow',
  cash: 'Cash & short-term investments',
  debt: 'Total debt',
  shares: 'Shares outstanding',
  price: 'Share price',
};

const REQUIRED: ReportedKey[] = ['freeCashFlow', 'cash', 'debt', 'shares'];

/** Starting growth when a company has neither an editor's choice nor history. */
export const FALLBACK_GROWTH = 0.05;
/** Derived starting points are kept inside this sensible band. */
export const DERIVED_GROWTH_BAND = { min: 0.02, max: 0.12 } as const;

/* --------------------------------------------------------- provenance --- */

function fromFiling(cited: CitedValue | undefined, cik: number): Figure | undefined {
  // A number with no citation is not a reported figure.
  if (!cited || !Number.isFinite(cited.value) || cited.citations.length === 0) return undefined;
  const first = cited.citations[0];
  return {
    value: cited.value,
    provenance: {
      kind: 'filing',
      form: first.form,
      periodEnd: first.periodEnd,
      filed: first.filed,
      accession: first.accession,
      concepts: cited.citations.map((c) => c.concept),
      url: filingUrl(cik, first.accession),
    },
  };
}

function isSampleEntry(profile: CompanyProfile): boolean {
  const hand = profile.hand;
  return !!hand && (hand.fiscalYear === SAMPLE_DATA || hand.snapshotDate === SAMPLE_DATA);
}

function fromHand(
  profile: CompanyProfile,
  value: number | undefined,
  source: string,
  asOf: string,
): Figure | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const provenance: Provenance = isSampleEntry(profile)
    ? { kind: 'sample' }
    : { kind: 'manual', source: source || 'Entered by hand', asOf };
  return { value, provenance };
}

/** The filing figure FCF is computed from: operating cash flow minus capex. */
function freeCashFlowFromFiling(record: SecRecord): Figure | undefined {
  const { operatingCashFlow, capex } = record.figures;
  if (!operatingCashFlow || !capex) return undefined;
  return fromFiling(
    {
      value: operatingCashFlow.value - capex.value,
      citations: [...operatingCashFlow.citations, ...capex.citations],
    },
    record.cik,
  );
}

/* ------------------------------------------------------------- history --- */

export interface HistoricalGrowth {
  /** Compound annual growth rate, as a decimal. */
  rate: number;
  years: number;
  fromEnd: string;
  toEnd: string;
}

/**
 * Compound annual growth between the first and last positive values in the
 * history. Null with fewer than two usable years — no trend from one point.
 */
export function historicalGrowth(
  history: readonly HistoryPoint[],
  key: 'revenue' | 'freeCashFlow',
): HistoricalGrowth | null {
  const usable = history.filter((p) => (p[key] ?? 0) > 0);
  if (usable.length < 2) return null;
  const first = usable[0];
  const last = usable[usable.length - 1];
  const years = (Date.parse(last.periodEnd) - Date.parse(first.periodEnd)) / (365.25 * 86_400_000);
  if (!(years >= 0.9)) return null;
  const rate = Math.pow((last[key] as number) / (first[key] as number), 1 / years) - 1;
  if (!Number.isFinite(rate)) return null;
  return { rate, years: Math.round(years), fromEnd: first.periodEnd, toEnd: last.periodEnd };
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function startingGrowthFor(profile: CompanyProfile, history: readonly HistoryPoint[]): StartingGrowth {
  if (profile.startingGrowth !== undefined) {
    return {
      value: clamp(profile.startingGrowth, GROWTH_RANGE.min, GROWTH_RANGE.max),
      basis: 'editor',
      note: 'A starting point chosen by ClearValue’s editor for this company.',
    };
  }
  const fcf = historicalGrowth(history, 'freeCashFlow');
  if (fcf) {
    const value = roundToStep(
      clamp(fcf.rate, DERIVED_GROWTH_BAND.min, DERIVED_GROWTH_BAND.max),
      GROWTH_RANGE.step,
    );
    const capped = Math.abs(value - fcf.rate) > GROWTH_RANGE.step;
    return {
      value,
      basis: 'history',
      note: capped
        ? `Based on its reported free cash flow trend, kept between ${DERIVED_GROWTH_BAND.min * 100}% and ${DERIVED_GROWTH_BAND.max * 100}% because past bursts rarely repeat.`
        : 'Based on how fast its reported free cash flow has grown.',
    };
  }
  return {
    value: FALLBACK_GROWTH,
    basis: 'default',
    note: 'A neutral starting point — there is not enough reported history to suggest one.',
  };
}

/* ------------------------------------------------------------- resolve --- */

export function companyId(ticker: string): string {
  return ticker.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function resolveCompany(profile: CompanyProfile, record?: SecRecord): Company {
  const hand = profile.hand;
  const src = hand?.sources;
  const handAsOf = hand?.snapshotDate ?? '';

  const reported: ReportedFigures = {};
  const set = (key: ReportedKey, figure: Figure | undefined) => {
    if (figure) reported[key] = figure;
  };

  if (record) {
    const f = record.figures;
    set('revenue', fromFiling(f.revenue, record.cik));
    set('operatingIncome', fromFiling(f.operatingIncome, record.cik));
    set('operatingCashFlow', fromFiling(f.operatingCashFlow, record.cik));
    set('capex', fromFiling(f.capex, record.cik));
    set('freeCashFlow', freeCashFlowFromFiling(record));
    set('cash', fromFiling(f.cash, record.cik));
    set('debt', fromFiling(f.debt, record.cik));
    set('shares', fromFiling(f.shares, record.cik));
  }

  // Hand-entered figures only fill gaps the filing data left.
  if (hand) {
    reported.freeCashFlow ??= fromHand(profile, hand.fcf0, src?.fcfSource ?? '', handAsOf);
    reported.cash ??= fromHand(profile, hand.cash, src?.fcfSource ?? '', handAsOf);
    reported.debt ??= fromHand(profile, hand.debt, src?.fcfSource ?? '', handAsOf);
    reported.shares ??= fromHand(profile, hand.sharesOutstanding, src?.sharesSource ?? '', handAsOf);
    set(
      'price',
      fromHand(profile, hand.currentPrice, 'Share price', src?.priceAsOf || handAsOf),
    );
  }

  for (const key of Object.keys(reported) as ReportedKey[]) {
    if (!reported[key]) delete reported[key];
  }

  const history = record?.history ?? [];
  const missing = REQUIRED.filter((key) => !reported[key]).map((key) => FIGURE_LABELS[key]);

  const status: Company['status'] = profile.notSuitable
    ? 'not-suitable'
    : missing.length > 0
      ? 'needs-figures'
      : (reported.freeCashFlow?.value ?? 0) <= 0 || (reported.shares?.value ?? 0) <= 0
        ? 'negative-fcf'
        : 'ready';

  const financials: Financials | null =
    status === 'ready'
      ? {
          fcf0: reported.freeCashFlow!.value,
          sharesOutstanding: reported.shares!.value,
          cash: reported.cash!.value,
          debt: reported.debt!.value,
          currentPrice: reported.price?.value ?? null,
        }
      : null;

  const usesSample = Object.values(reported).some((f) => f?.provenance.kind === 'sample');

  return {
    ...profile,
    id: companyId(profile.ticker),
    reported,
    history,
    periodEnd: record?.periodEnd ?? null,
    status,
    missing,
    financials,
    startingGrowth: startingGrowthFor(profile, history),
    usesSample,
    dataNotes: record?.issues ?? [],
  };
}

/* -------------------------------------------------------------- bundle --- */

interface SecFile {
  generatedAt: string | null;
  records: Record<string, SecRecord>;
}

const SEC = secData as unknown as SecFile;

/** When the SEC data was last downloaded, or null if it never has been. */
export const SEC_GENERATED_AT = SEC.generatedAt;

export const COMPANIES: Company[] = CATALOG.map((profile) =>
  resolveCompany(profile, SEC.records[profile.ticker]),
);

export const COMPANY_BY_ID = new Map(COMPANIES.map((c) => [c.id, c]));

/** Companies the model can value right now. */
export const READY_COMPANIES = COMPANIES.filter((c) => c.status === 'ready');

/** True while any valuable company shows unverified sample data. */
export const HAS_SAMPLE_DATA = READY_COMPANIES.some((c) => c.usesSample);

/** Beginner-friendly picks for the "Start here" row. Only ones that work. */
export const POPULAR_COMPANIES = COMPANIES.filter((c) => c.popular && c.status === 'ready');

/* ------------------------------------------------------- presentation --- */

/** Two-or-three-letter mark for the card tiles. No real logos, by design. */
export function monogram(company: Pick<Company, 'ticker'>): string {
  return company.ticker.replace(/[^A-Z]/g, '').slice(0, 2);
}

/** A short, honest line on where this company's figures came from. */
export function dataVintage(company: Company): string {
  if (company.usesSample) {
    return `SAMPLE DATA — some of ${company.name}'s figures are placeholders that have not been checked against a filing.`;
  }
  const sources = Object.values(company.reported).map((f) => f!.provenance);
  const filing = sources.find((p) => p.kind === 'filing');
  if (filing && filing.kind === 'filing') {
    return `Reported figures from ${company.name}'s ${filing.form} for the fiscal year ending ${formatDate(filing.periodEnd)}, via SEC EDGAR.`;
  }
  const hand = company.hand;
  if (hand) {
    return `Figures from ${company.name}'s ${hand.fiscalYear} annual report · entered ${formatDate(hand.snapshotDate)}.`;
  }
  return `${company.name}'s reported figures have not been loaded yet.`;
}

export function formatDate(iso: string): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return iso;
  return new Date(time).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/* -------------------------------------------------------------- search --- */

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // "McDonald's" should match "mcdonalds", so apostrophes join, not split.
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Search by name, ticker, sector or industry. Ticker matches rank first, then
 * names that start with the query, then everything else in catalog order.
 */
export function searchCompanies(
  query: string,
  companies: readonly Company[] = COMPANIES,
  group: SectorGroup | 'All' = 'All',
): Company[] {
  const pool = group === 'All' ? companies : companies.filter((c) => c.group === group);
  const q = normalise(query);
  if (!q) return [...pool];

  const scored: { company: Company; score: number }[] = [];
  for (const company of pool) {
    const ticker = normalise(company.ticker);
    const name = normalise(company.name);
    const rest = normalise(`${company.group} ${company.industry} ${company.whatTheyDo}`);
    let score = -1;
    if (ticker === q) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (ticker.startsWith(q)) score = 2;
    else if (name.split(' ').some((word) => word.startsWith(q))) score = 3;
    else if (name.includes(q)) score = 4;
    // Descriptions only once the query is long enough to mean something:
    // "coffee" should find Starbucks, but "a" should not find everything.
    else if (q.length >= 3 && rest.includes(q)) score = 5;
    if (score >= 0) scored.push({ company, score });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.company);
}

/** How many companies sit in each filter chip. */
export function countByGroup(companies: readonly Company[] = COMPANIES): Record<SectorGroup | 'All', number> {
  const counts = { All: companies.length } as Record<SectorGroup | 'All', number>;
  for (const group of SECTOR_GROUPS) counts[group] = 0;
  for (const company of companies) counts[company.group] += 1;
  return counts;
}
