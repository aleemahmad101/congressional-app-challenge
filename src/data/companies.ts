/**
 * Bundled company snapshots.
 *
 * ⚠ EVERY FIGURE BELOW IS SAMPLE DATA. Nothing here has been checked against a
 * filing. Each number carries a `// VERIFY` marker, each entry's `sources` are
 * empty, and each `snapshotDate` is the SAMPLE_DATA sentinel.
 *
 * The app says so on screen wherever a figure appears, and `npm run check:data`
 * fails until every one of them is replaced. Do not deploy before it passes.
 *
 * To fill these in, work through `data/VERIFICATION.md` — one company at a
 * time, straight from the 10-K. Ten companies you can defend are worth more
 * than twenty you cannot.
 *
 * This is a .ts file rather than companies.json for one reason: JSON cannot
 * hold the per-number `// VERIFY` markers the checking pass depends on. It is
 * still plain static data — no logic, no network.
 *
 * No real company logos are used anywhere in this app. Cards render a
 * generated two-letter monogram from the ticker.
 */

import type { Financials } from '../lib/dcf';

/** Where each figure came from. Empty strings mean "not yet verified". */
export interface CompanySources {
  /** URL or filing reference for free cash flow. */
  fcfSource: string;
  /** URL or filing reference for the share count. */
  sharesSource: string;
  /** The date the share price was taken, as YYYY-MM-DD. */
  priceAsOf: string;
}

export interface Company extends Financials {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  /** One plain sentence: what does this company actually sell? */
  whatTheyDo: string;
  /** Starting growth assumption for years 1-5, as a decimal. */
  defaultGrowth: number;
  /**
   * The fiscal year the financials come from, e.g. "FY2025".
   * Holds SAMPLE_DATA until verified.
   */
  fiscalYear: string;
  /** ISO date the figures were taken. Holds SAMPLE_DATA until verified. */
  snapshotDate: string;
  sources: CompanySources;
}

/**
 * The sentinel that marks an unverified entry. `check:data` looks for exactly
 * this string, and the UI shows a warning caption whenever it sees it.
 */
export const SAMPLE_DATA = 'SAMPLE DATA';

const UNVERIFIED: CompanySources = { fcfSource: '', sharesSource: '', priceAsOf: '' };

export const COMPANIES: Company[] = [
  {
    id: 'apple',
    name: 'Apple',
    ticker: 'AAPL',
    sector: 'Consumer technology',
    whatTheyDo: 'Sells iPhones, Macs, and subscription services like iCloud and Apple Music.',
    fcf0: 108_800_000_000, // VERIFY
    sharesOutstanding: 14_940_000_000, // VERIFY
    cash: 65_200_000_000, // VERIFY
    debt: 106_600_000_000, // VERIFY
    currentPrice: 229.5, // VERIFY
    defaultGrowth: 0.08, // VERIFY
    fiscalYear: SAMPLE_DATA,
    snapshotDate: SAMPLE_DATA,
    sources: { ...UNVERIFIED },
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    ticker: 'MSFT',
    sector: 'Software & cloud',
    whatTheyDo: 'Sells Windows, Office subscriptions, and Azure cloud computing to businesses.',
    fcf0: 74_100_000_000, // VERIFY
    sharesOutstanding: 7_430_000_000, // VERIFY
    cash: 75_500_000_000, // VERIFY
    debt: 97_000_000_000, // VERIFY
    currentPrice: 421.0, // VERIFY
    defaultGrowth: 0.12, // VERIFY
    fiscalYear: SAMPLE_DATA,
    snapshotDate: SAMPLE_DATA,
    sources: { ...UNVERIFIED },
  },
  {
    id: 'costco',
    name: 'Costco',
    ticker: 'COST',
    sector: 'Warehouse retail',
    whatTheyDo: 'Sells groceries and household goods in bulk to members who pay an annual fee.',
    fcf0: 6_700_000_000, // VERIFY
    sharesOutstanding: 444_000_000, // VERIFY
    cash: 11_100_000_000, // VERIFY
    debt: 9_000_000_000, // VERIFY
    currentPrice: 878.0, // VERIFY
    defaultGrowth: 0.1, // VERIFY
    fiscalYear: SAMPLE_DATA,
    snapshotDate: SAMPLE_DATA,
    sources: { ...UNVERIFIED },
  },
  {
    id: 'nike',
    name: 'Nike',
    ticker: 'NKE',
    sector: 'Apparel & footwear',
    whatTheyDo: 'Designs and sells athletic shoes and clothing, mostly made by outside factories.',
    fcf0: 6_000_000_000, // VERIFY
    sharesOutstanding: 1_490_000_000, // VERIFY
    cash: 9_900_000_000, // VERIFY
    debt: 12_100_000_000, // VERIFY
    currentPrice: 77.8, // VERIFY
    defaultGrowth: 0.05, // VERIFY
    fiscalYear: SAMPLE_DATA,
    snapshotDate: SAMPLE_DATA,
    sources: { ...UNVERIFIED },
  },
  {
    id: 'mcdonalds',
    name: "McDonald's",
    ticker: 'MCD',
    sector: 'Restaurants',
    whatTheyDo: 'Collects rent and royalties from franchisees who run most of its restaurants.',
    fcf0: 6_700_000_000, // VERIFY
    sharesOutstanding: 718_000_000, // VERIFY
    cash: 1_100_000_000, // VERIFY
    debt: 38_600_000_000, // VERIFY
    currentPrice: 289.4, // VERIFY
    defaultGrowth: 0.05, // VERIFY
    fiscalYear: SAMPLE_DATA,
    snapshotDate: SAMPLE_DATA,
    sources: { ...UNVERIFIED },
  },
  {
    id: 'disney',
    name: 'Disney',
    ticker: 'DIS',
    sector: 'Media & parks',
    whatTheyDo: 'Makes films and shows, runs theme parks, and sells Disney+ subscriptions.',
    fcf0: 8_600_000_000, // VERIFY
    sharesOutstanding: 1_830_000_000, // VERIFY
    cash: 6_000_000_000, // VERIFY
    debt: 47_500_000_000, // VERIFY
    currentPrice: 94.7, // VERIFY
    defaultGrowth: 0.07, // VERIFY
    fiscalYear: SAMPLE_DATA,
    snapshotDate: SAMPLE_DATA,
    sources: { ...UNVERIFIED },
  },
  {
    id: 'coca-cola',
    name: 'Coca-Cola',
    ticker: 'KO',
    sector: 'Beverages',
    whatTheyDo: 'Sells drink concentrate to bottlers who make and deliver the finished sodas.',
    fcf0: 9_500_000_000, // VERIFY
    sharesOutstanding: 4_310_000_000, // VERIFY
    cash: 12_500_000_000, // VERIFY
    debt: 42_400_000_000, // VERIFY
    currentPrice: 69.8, // VERIFY
    defaultGrowth: 0.05, // VERIFY
    fiscalYear: SAMPLE_DATA,
    snapshotDate: SAMPLE_DATA,
    sources: { ...UNVERIFIED },
  },
  {
    id: 'verizon',
    name: 'Verizon',
    ticker: 'VZ',
    sector: 'Telecom',
    whatTheyDo: 'Sells phone and internet service over a network it builds and maintains itself.',
    fcf0: 18_700_000_000, // VERIFY
    sharesOutstanding: 4_210_000_000, // VERIFY
    cash: 2_400_000_000, // VERIFY
    debt: 149_600_000_000, // VERIFY
    currentPrice: 40.9, // VERIFY
    defaultGrowth: 0.02, // VERIFY
    fiscalYear: SAMPLE_DATA,
    snapshotDate: SAMPLE_DATA,
    sources: { ...UNVERIFIED },
  },
  {
    id: 'home-depot',
    name: 'Home Depot',
    ticker: 'HD',
    sector: 'Home improvement retail',
    whatTheyDo: 'Sells tools, lumber, and building supplies to homeowners and contractors.',
    fcf0: 17_000_000_000, // VERIFY
    sharesOutstanding: 993_000_000, // VERIFY
    cash: 3_800_000_000, // VERIFY
    debt: 47_600_000_000, // VERIFY
    currentPrice: 368.0, // VERIFY
    defaultGrowth: 0.045, // VERIFY
    fiscalYear: SAMPLE_DATA,
    snapshotDate: SAMPLE_DATA,
    sources: { ...UNVERIFIED },
  },
  {
    id: 'starbucks',
    name: 'Starbucks',
    ticker: 'SBUX',
    sector: 'Restaurants',
    whatTheyDo: 'Sells coffee drinks and food in company-run and licensed cafés worldwide.',
    fcf0: 3_300_000_000, // VERIFY
    sharesOutstanding: 1_133_000_000, // VERIFY
    cash: 3_300_000_000, // VERIFY
    debt: 25_800_000_000, // VERIFY
    currentPrice: 94.2, // VERIFY
    defaultGrowth: 0.06, // VERIFY
    fiscalYear: SAMPLE_DATA,
    snapshotDate: SAMPLE_DATA,
    sources: { ...UNVERIFIED },
  },
];

/** True while any figure on this company is still unverified sample data. */
export function isSampleData(company: Company): boolean {
  return company.snapshotDate === SAMPLE_DATA || company.fiscalYear === SAMPLE_DATA;
}

/** True while any company in the bundle is still unverified. */
export const HAS_SAMPLE_DATA = COMPANIES.some(isSampleData);

/**
 * The data-vintage caption shown under every result. Says plainly which of the
 * two worlds we are in rather than hiding the difference.
 */
export function dataVintage(company: Company): string {
  if (isSampleData(company)) {
    return `SAMPLE DATA — ${company.name}'s figures have not been verified against a filing yet.`;
  }
  return `Figures from ${company.name}'s ${company.fiscalYear} annual report · snapshot ${company.snapshotDate}.`;
}

/** Two-letter mark for the card tiles. No real logos, by design. */
export function monogram(company: Pick<Company, 'ticker'>): string {
  return company.ticker.slice(0, 2);
}

export function searchCompanies(query: string, companies = COMPANIES): Company[] {
  const q = query.trim().toLowerCase();
  if (!q) return companies;
  return companies.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.ticker.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q),
  );
}
