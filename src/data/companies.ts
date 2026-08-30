/**
 * Bundled company snapshots.
 *
 * ⚠ EVERY FIGURE BELOW IS A PLACEHOLDER. Each one carries a `// VERIFY` marker.
 * Before submission, replace each number with the corresponding figure from the
 * company's most recent 10-K (free cash flow = cash from operations − capital
 * expenditures), update `snapshotDate`, and delete the marker once checked.
 *
 * Search the repo for "VERIFY" to find everything still outstanding.
 *
 * This is a .ts file rather than companies.json for one reason: JSON cannot
 * hold the per-number `// VERIFY` markers the checking pass depends on.
 * It is still plain static data — no logic, no network.
 *
 * No real company logos are used anywhere in this app. Cards render a
 * generated two-letter monogram from the ticker.
 */

import type { Financials } from '../lib/dcf';

export interface Company extends Financials {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  /** One plain sentence: what does this company actually sell? */
  whatTheyDo: string;
  /** Starting growth assumption for years 1-5, as a decimal. */
  defaultGrowth: number;
  /** ISO date the financials and price were taken from. */
  snapshotDate: string;
}

/** Shown in the footer disclaimer. Keep in sync with the entries below. */
export const SNAPSHOT_DATE = '2026-08-01';

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
    snapshotDate: SNAPSHOT_DATE,
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
    snapshotDate: SNAPSHOT_DATE,
  },
  {
    id: 'alphabet',
    name: 'Alphabet',
    ticker: 'GOOGL',
    sector: 'Internet & advertising',
    whatTheyDo: 'Runs Google Search, YouTube, and Android, and sells the ads that appear on them.',
    fcf0: 69_500_000_000, // VERIFY
    sharesOutstanding: 12_200_000_000, // VERIFY
    cash: 100_700_000_000, // VERIFY
    debt: 28_100_000_000, // VERIFY
    currentPrice: 174.6, // VERIFY
    defaultGrowth: 0.12, // VERIFY
    snapshotDate: SNAPSHOT_DATE,
  },
  {
    id: 'amazon',
    name: 'Amazon',
    ticker: 'AMZN',
    sector: 'Retail & cloud',
    whatTheyDo: 'Runs the largest online store in the U.S. and rents out computing power as AWS.',
    fcf0: 53_000_000_000, // VERIFY
    sharesOutstanding: 10_500_000_000, // VERIFY
    cash: 88_000_000_000, // VERIFY
    debt: 130_900_000_000, // VERIFY
    currentPrice: 184.9, // VERIFY
    defaultGrowth: 0.14, // VERIFY
    snapshotDate: SNAPSHOT_DATE,
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
    snapshotDate: SNAPSHOT_DATE,
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
    snapshotDate: SNAPSHOT_DATE,
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
    snapshotDate: SNAPSHOT_DATE,
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
    snapshotDate: SNAPSHOT_DATE,
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
    snapshotDate: SNAPSHOT_DATE,
  },
  {
    id: 'pepsico',
    name: 'PepsiCo',
    ticker: 'PEP',
    sector: 'Beverages & snacks',
    whatTheyDo: 'Sells Pepsi, Gatorade, Doritos, and Quaker foods through its own delivery fleet.',
    fcf0: 7_900_000_000, // VERIFY
    sharesOutstanding: 1_374_000_000, // VERIFY
    cash: 9_200_000_000, // VERIFY
    debt: 44_100_000_000, // VERIFY
    currentPrice: 168.9, // VERIFY
    defaultGrowth: 0.045, // VERIFY
    snapshotDate: SNAPSHOT_DATE,
  },
  {
    id: 'johnson-johnson',
    name: 'Johnson & Johnson',
    ticker: 'JNJ',
    sector: 'Pharmaceuticals',
    whatTheyDo: 'Develops prescription medicines and sells surgical and medical devices.',
    fcf0: 18_400_000_000, // VERIFY
    sharesOutstanding: 2_410_000_000, // VERIFY
    cash: 23_500_000_000, // VERIFY
    debt: 36_600_000_000, // VERIFY
    currentPrice: 159.7, // VERIFY
    defaultGrowth: 0.04, // VERIFY
    snapshotDate: SNAPSHOT_DATE,
  },
  {
    id: 'procter-gamble',
    name: 'Procter & Gamble',
    ticker: 'PG',
    sector: 'Household goods',
    whatTheyDo: 'Makes everyday brands like Tide, Pampers, Gillette, and Crest.',
    fcf0: 16_500_000_000, // VERIFY
    sharesOutstanding: 2_360_000_000, // VERIFY
    cash: 9_500_000_000, // VERIFY
    debt: 34_400_000_000, // VERIFY
    currentPrice: 169.4, // VERIFY
    defaultGrowth: 0.04, // VERIFY
    snapshotDate: SNAPSHOT_DATE,
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
    snapshotDate: SNAPSHOT_DATE,
  },
  {
    id: 'target',
    name: 'Target',
    ticker: 'TGT',
    sector: 'General retail',
    whatTheyDo: 'Runs about two thousand stores selling groceries, clothing, and home goods.',
    fcf0: 3_800_000_000, // VERIFY
    sharesOutstanding: 462_000_000, // VERIFY
    cash: 3_800_000_000, // VERIFY
    debt: 16_200_000_000, // VERIFY
    currentPrice: 144.6, // VERIFY
    defaultGrowth: 0.04, // VERIFY
    snapshotDate: SNAPSHOT_DATE,
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
    snapshotDate: SNAPSHOT_DATE,
  },
  {
    id: 'visa',
    name: 'Visa',
    ticker: 'V',
    sector: 'Payments',
    whatTheyDo: 'Runs the network that moves card payments between banks and takes a small cut.',
    fcf0: 18_700_000_000, // VERIFY
    sharesOutstanding: 1_970_000_000, // VERIFY
    cash: 16_100_000_000, // VERIFY
    debt: 20_600_000_000, // VERIFY
    currentPrice: 274.3, // VERIFY
    defaultGrowth: 0.1, // VERIFY
    snapshotDate: SNAPSHOT_DATE,
  },
  {
    id: 'ups',
    name: 'UPS',
    ticker: 'UPS',
    sector: 'Logistics',
    whatTheyDo: 'Picks up and delivers packages for businesses and households worldwide.',
    fcf0: 5_800_000_000, // VERIFY
    sharesOutstanding: 855_000_000, // VERIFY
    cash: 6_100_000_000, // VERIFY
    debt: 22_300_000_000, // VERIFY
    currentPrice: 129.7, // VERIFY
    defaultGrowth: 0.035, // VERIFY
    snapshotDate: SNAPSHOT_DATE,
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
    snapshotDate: SNAPSHOT_DATE,
  },
  {
    id: 'netflix',
    name: 'Netflix',
    ticker: 'NFLX',
    sector: 'Streaming media',
    whatTheyDo: 'Sells monthly streaming subscriptions and pays to make and license the shows.',
    fcf0: 6_900_000_000, // VERIFY
    sharesOutstanding: 430_000_000, // VERIFY
    cash: 7_100_000_000, // VERIFY
    debt: 14_600_000_000, // VERIFY
    currentPrice: 679.0, // VERIFY
    defaultGrowth: 0.16, // VERIFY
    snapshotDate: SNAPSHOT_DATE,
  },
  {
    id: 'comcast',
    name: 'Comcast',
    ticker: 'CMCSA',
    sector: 'Cable & media',
    whatTheyDo: 'Sells home internet and cable TV, and owns NBCUniversal and Peacock.',
    fcf0: 13_000_000_000, // VERIFY
    sharesOutstanding: 3_900_000_000, // VERIFY
    cash: 6_600_000_000, // VERIFY
    debt: 98_800_000_000, // VERIFY
    currentPrice: 39.8, // VERIFY
    defaultGrowth: 0.025, // VERIFY
    snapshotDate: SNAPSHOT_DATE,
  },
];

/** Shown on the empty state as a way in. */
export const SUGGESTED_IDS = ['apple', 'costco', 'nike'];

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
