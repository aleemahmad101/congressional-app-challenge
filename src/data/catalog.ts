/**
 * Every company ClearValue offers. ONE entry per company, and this is the only
 * file to edit when adding one.
 *
 * What lives here is identity — name, ticker, sector, a plain sentence about
 * the business — plus, optionally, figures typed in by hand.
 *
 * Reported financial figures do NOT live here. They come from SEC EDGAR:
 *
 *   npm run data:fetch
 *
 * downloads each company's 10-K data, records the filing every number came
 * from, and writes src/data/sec-financials.json. A company with no SEC data
 * and no hand-entered figures still appears in the picker, honestly marked as
 * missing figures — the app never invents them.
 *
 * Hand-entered figures (`hand`) fill gaps the SEC data does not cover — most
 * importantly the share price, which is not in any filing. Where both exist,
 * the filing wins. Entries whose `fiscalYear` is SAMPLE_DATA are unverified
 * placeholders: every number carries a `// VERIFY` marker, the UI labels them
 * as sample data, and `npm run check:data` blocks the deploy until they are
 * replaced. See data/VERIFICATION.md.
 *
 * Adding a company:
 *   1. Add a profile below (ticker exactly as SEC lists it, "." for classes).
 *   2. Run `npm run data:fetch`.
 *   3. Optionally add `referencePrice` + `referencePriceDate` (a closing price
 *      from REFERENCE_PRICE_DATE) so the estimate can be compared with it.
 *   4. Run `npm run check:data`.
 *
 * No real company logos are used anywhere. Cards render a monogram.
 */

import type { CompanyProfile } from './types';

/**
 * The sentinel that marks an unverified entry. `check:data` looks for exactly
 * this string, and the UI shows a warning whenever it sees it.
 */
export const SAMPLE_DATA = 'SAMPLE DATA';

/**
 * Every reference market price in the catalog is the regular-session closing
 * price on this one date — a fixed snapshot, deliberately not a live quote.
 * A company without a verified price on this date has no `referencePrice`,
 * and the app hides the comparison rather than inventing one.
 */
export const REFERENCE_PRICE_DATE = '2026-10-02';
export const REFERENCE_PRICE_TYPE = 'Regular-session closing price';
export const REFERENCE_PRICE_CURRENCY = 'USD';

/** Why manufacturers with large in-house lenders are not valued here. */
const CAPTIVE_LENDER =
  'Besides building machines, this company runs a large lending business that finances customers’ purchases. That lender borrows tens of billions of dollars to make loans, so its debt and cash flows mix with the factory business. Analysts value the two halves separately, which a single cash-flow forecast cannot do honestly.';

/** Why the lending businesses are not valued here. Shown on screen. */
const BANK =
  'Banks earn money by borrowing and lending, so debt is their raw material rather than a claim on the business, and their "cash flow" swings with deposits and loans. Analysts value them on earnings and book value instead of free cash flow.';

export const CATALOG: CompanyProfile[] = [
  /* ------------------------------------------------------------ Technology */
  {
    ticker: 'AAPL',
    name: 'Apple',
    group: 'Technology',
    industry: 'Consumer electronics',
    whatTheyDo: 'Sells iPhones, Macs, and subscription services like iCloud and Apple Music.',
    popular: true,
    referencePrice: 333.69,
    referencePriceDate: REFERENCE_PRICE_DATE,
    startingGrowth: 0.108,
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft',
    group: 'Technology',
    industry: 'Software & cloud',
    whatTheyDo: 'Sells Windows, Office subscriptions, and Azure cloud computing to businesses.',
    popular: true,
    referencePrice: 517.53,
    referencePriceDate: REFERENCE_PRICE_DATE,
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet (Google)',
    group: 'Technology',
    industry: 'Search & advertising',
    whatTheyDo: 'Earns most of its money from ads on Google Search and YouTube, plus cloud services.',
  },
  {
    ticker: 'AMZN',
    name: 'Amazon',
    group: 'Technology',
    industry: 'E-commerce & cloud',
    whatTheyDo: 'Runs a giant online store and rents computing power through Amazon Web Services.',
  },
  {
    ticker: 'META',
    name: 'Meta Platforms',
    group: 'Technology',
    industry: 'Social media & advertising',
    whatTheyDo: 'Sells ads shown to people using Facebook, Instagram, and WhatsApp.',
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA',
    group: 'Technology',
    industry: 'Semiconductors',
    whatTheyDo: 'Designs the graphics chips used for gaming and for training AI models.',
  },
  {
    ticker: 'AMD',
    name: 'AMD',
    group: 'Technology',
    industry: 'Semiconductors',
    whatTheyDo: 'Designs processors and graphics chips for PCs, game consoles, and data centers.',
  },
  {
    ticker: 'INTC',
    name: 'Intel',
    group: 'Technology',
    industry: 'Semiconductors',
    whatTheyDo: 'Designs and manufactures the processors inside most PCs and many servers.',
  },
  {
    ticker: 'AVGO',
    name: 'Broadcom',
    group: 'Technology',
    industry: 'Semiconductors',
    whatTheyDo: 'Makes networking and wireless chips, and sells infrastructure software to businesses.',
  },
  {
    ticker: 'QCOM',
    name: 'Qualcomm',
    group: 'Technology',
    industry: 'Semiconductors',
    whatTheyDo: 'Designs the chips in many smartphones and collects royalties on wireless patents.',
  },
  {
    ticker: 'TXN',
    name: 'Texas Instruments',
    group: 'Technology',
    industry: 'Semiconductors',
    whatTheyDo: 'Manufactures simple, long-lasting chips used in cars, factories, and appliances.',
  },
  {
    ticker: 'ORCL',
    name: 'Oracle',
    group: 'Technology',
    industry: 'Software & cloud',
    whatTheyDo: 'Sells database software and cloud computing to large organizations.',
  },
  {
    ticker: 'CRM',
    name: 'Salesforce',
    group: 'Technology',
    industry: 'Business software',
    whatTheyDo: 'Rents online software that sales and support teams use to track customers.',
  },
  {
    ticker: 'ADBE',
    name: 'Adobe',
    group: 'Technology',
    industry: 'Creative software',
    whatTheyDo: 'Sells subscriptions to Photoshop, Acrobat, and other tools for creating documents and media.',
  },
  {
    ticker: 'CSCO',
    name: 'Cisco',
    group: 'Technology',
    industry: 'Networking equipment',
    whatTheyDo: 'Sells the routers, switches, and security systems that connect business networks.',
  },
  {
    ticker: 'IBM',
    name: 'IBM',
    group: 'Technology',
    industry: 'IT services & software',
    whatTheyDo: 'Sells software, consulting, and mainframe computers to big companies and governments.',
  },

  /* -------------------------------------------------------------- Consumer */
  {
    ticker: 'COST',
    name: 'Costco',
    group: 'Consumer',
    industry: 'Warehouse retail',
    whatTheyDo: 'Sells groceries and household goods in bulk to members who pay an annual fee.',
  },
  {
    ticker: 'WMT',
    name: 'Walmart',
    group: 'Consumer',
    industry: 'Discount retail',
    whatTheyDo: 'Runs the largest chain of discount stores and supercenters in the U.S.',
  },
  {
    ticker: 'TGT',
    name: 'Target',
    group: 'Consumer',
    industry: 'Discount retail',
    whatTheyDo: 'Runs general-merchandise stores selling clothing, home goods, and groceries.',
  },
  {
    ticker: 'HD',
    name: 'Home Depot',
    group: 'Consumer',
    industry: 'Home improvement retail',
    whatTheyDo: 'Sells tools, lumber, and building supplies to homeowners and contractors.',
  },
  {
    ticker: 'LOW',
    name: "Lowe's",
    group: 'Consumer',
    industry: 'Home improvement retail',
    whatTheyDo: 'Sells appliances, tools, and building materials, mostly to do-it-yourself homeowners.',
  },
  {
    ticker: 'NKE',
    name: 'Nike',
    group: 'Consumer',
    industry: 'Apparel & footwear',
    whatTheyDo: 'Designs and sells athletic shoes and clothing, mostly made by outside factories.',
    popular: true,
    referencePrice: 33.87,
    referencePriceDate: REFERENCE_PRICE_DATE,
  },
  {
    ticker: 'SBUX',
    name: 'Starbucks',
    group: 'Consumer',
    industry: 'Restaurants',
    whatTheyDo: 'Sells coffee drinks and food in company-run and licensed cafés worldwide.',
  },
  {
    ticker: 'MCD',
    name: "McDonald's",
    group: 'Consumer',
    industry: 'Restaurants',
    whatTheyDo: 'Collects rent and royalties from franchisees who run most of its restaurants.',
    popular: true,
    referencePrice: 231.89,
    referencePriceDate: REFERENCE_PRICE_DATE,
  },
  {
    ticker: 'CMG',
    name: 'Chipotle',
    group: 'Consumer',
    industry: 'Restaurants',
    whatTheyDo: 'Runs fast-casual burrito restaurants, all owned by the company rather than franchised.',
  },
  {
    ticker: 'KO',
    name: 'Coca-Cola',
    group: 'Consumer',
    industry: 'Beverages',
    whatTheyDo: 'Sells drink concentrate to bottlers who make and deliver the finished sodas.',
    popular: true,
    referencePrice: 85.65,
    referencePriceDate: REFERENCE_PRICE_DATE,
  },
  {
    ticker: 'PEP',
    name: 'PepsiCo',
    group: 'Consumer',
    industry: 'Beverages & snacks',
    whatTheyDo: 'Sells Pepsi and Gatorade drinks along with Frito-Lay chips and Quaker foods.',
  },
  {
    ticker: 'PG',
    name: 'Procter & Gamble',
    group: 'Consumer',
    industry: 'Household products',
    whatTheyDo: 'Makes everyday brands like Tide, Pampers, Crest, and Gillette.',
  },
  {
    ticker: 'TSLA',
    name: 'Tesla',
    group: 'Consumer',
    industry: 'Automotive',
    whatTheyDo: 'Builds electric cars and sells battery systems for homes and power grids.',
  },
  {
    ticker: 'GM',
    name: 'General Motors',
    group: 'Consumer',
    industry: 'Automotive',
    whatTheyDo: 'Builds Chevrolet, GMC, Cadillac, and Buick vehicles and lends money to buyers.',
    notSuitable: CAPTIVE_LENDER,
  },
  {
    ticker: 'F',
    name: 'Ford',
    group: 'Consumer',
    industry: 'Automotive',
    whatTheyDo: 'Builds Ford trucks and cars, including the F-150, and finances customer purchases.',
    notSuitable: CAPTIVE_LENDER,
  },

  /* -------------------------------------------------------- Communications */
  {
    ticker: 'DIS',
    name: 'Disney',
    group: 'Communications',
    industry: 'Media & parks',
    whatTheyDo: 'Makes films and shows, runs theme parks, and sells Disney+ subscriptions.',
    popular: true,
    referencePrice: 102.19,
    referencePriceDate: REFERENCE_PRICE_DATE,
  },
  {
    ticker: 'NFLX',
    name: 'Netflix',
    group: 'Communications',
    industry: 'Streaming',
    whatTheyDo: 'Charges a monthly subscription to stream films and shows, many of which it makes itself.',
  },
  {
    ticker: 'CMCSA',
    name: 'Comcast',
    group: 'Communications',
    industry: 'Cable & media',
    whatTheyDo: 'Sells home internet and cable TV, and owns NBC, Universal studios, and theme parks.',
  },
  {
    ticker: 'T',
    name: 'AT&T',
    group: 'Communications',
    industry: 'Telecom',
    whatTheyDo: 'Sells wireless phone plans and fiber internet across the U.S.',
  },
  {
    ticker: 'VZ',
    name: 'Verizon',
    group: 'Communications',
    industry: 'Telecom',
    whatTheyDo: 'Sells phone and internet service over a network it builds and maintains itself.',
  },
  {
    ticker: 'TMUS',
    name: 'T-Mobile US',
    group: 'Communications',
    industry: 'Telecom',
    whatTheyDo: 'Sells wireless phone plans and home internet over its 5G network.',
  },

  /* --------------------------------------------------------------- Finance */
  {
    ticker: 'V',
    name: 'Visa',
    group: 'Finance',
    industry: 'Payments',
    whatTheyDo: 'Runs the network that moves money between card-holders’ banks and stores, for a small fee.',
  },
  {
    ticker: 'MA',
    name: 'Mastercard',
    group: 'Finance',
    industry: 'Payments',
    whatTheyDo: 'Runs a card payment network and charges a small fee on each transaction.',
  },
  {
    ticker: 'PYPL',
    name: 'PayPal',
    group: 'Finance',
    industry: 'Payments',
    whatTheyDo: 'Lets people and businesses send money online through PayPal and Venmo.',
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase',
    group: 'Finance',
    industry: 'Banking',
    whatTheyDo: 'The largest U.S. bank: takes deposits, makes loans, and advises big companies.',
    notSuitable: BANK,
  },
  {
    ticker: 'BAC',
    name: 'Bank of America',
    group: 'Finance',
    industry: 'Banking',
    whatTheyDo: 'Takes deposits and makes loans to millions of households and businesses.',
    notSuitable: BANK,
  },
  {
    ticker: 'GS',
    name: 'Goldman Sachs',
    group: 'Finance',
    industry: 'Investment banking',
    whatTheyDo: 'Advises companies on deals, trades securities, and manages money for wealthy clients.',
    notSuitable: BANK,
  },
  {
    ticker: 'MS',
    name: 'Morgan Stanley',
    group: 'Finance',
    industry: 'Investment banking',
    whatTheyDo: 'Runs a large wealth-management business and an investment bank.',
    notSuitable: BANK,
  },
  {
    ticker: 'AXP',
    name: 'American Express',
    group: 'Finance',
    industry: 'Cards & lending',
    whatTheyDo: 'Issues charge and credit cards and lends to the people who carry them.',
    notSuitable: BANK,
  },
  {
    ticker: 'BRK.B',
    name: 'Berkshire Hathaway',
    group: 'Finance',
    industry: 'Insurance & conglomerate',
    whatTheyDo: 'Owns GEICO, BNSF Railway, and dozens of other businesses, plus a huge stock portfolio.',
    notSuitable:
      'Berkshire is mostly an insurer holding a giant investment portfolio, and its two share classes are worth very different amounts. Analysts value it piece by piece — the investments, the insurance float, the railroad — rather than with one cash-flow forecast.',
  },

  /* ------------------------------------------------------------ Healthcare */
  {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    group: 'Healthcare',
    industry: 'Pharmaceuticals & devices',
    whatTheyDo: 'Develops prescription medicines and sells surgical and medical devices.',
  },
  {
    ticker: 'PFE',
    name: 'Pfizer',
    group: 'Healthcare',
    industry: 'Pharmaceuticals',
    whatTheyDo: 'Discovers and sells prescription drugs and vaccines.',
  },
  {
    ticker: 'MRK',
    name: 'Merck',
    group: 'Healthcare',
    industry: 'Pharmaceuticals',
    whatTheyDo: 'Develops prescription medicines, including cancer drugs and vaccines.',
  },
  {
    ticker: 'ABBV',
    name: 'AbbVie',
    group: 'Healthcare',
    industry: 'Pharmaceuticals',
    whatTheyDo: 'Sells prescription drugs for immune diseases and cancer, plus Botox.',
  },
  {
    ticker: 'LLY',
    name: 'Eli Lilly',
    group: 'Healthcare',
    industry: 'Pharmaceuticals',
    whatTheyDo: 'Makes medicines for diabetes, obesity, and cancer.',
  },
  {
    ticker: 'UNH',
    name: 'UnitedHealth',
    group: 'Healthcare',
    industry: 'Health insurance',
    whatTheyDo: 'Sells health insurance and runs clinics, pharmacy services, and health data businesses.',
  },

  /* ------------------------------------------------------------ Industrial */
  {
    ticker: 'CAT',
    name: 'Caterpillar',
    group: 'Industrial',
    industry: 'Heavy machinery',
    whatTheyDo: 'Builds bulldozers, mining trucks, and engines, and sells parts to keep them running.',
    notSuitable: CAPTIVE_LENDER,
  },
  {
    ticker: 'DE',
    name: 'John Deere',
    group: 'Industrial',
    industry: 'Farm machinery',
    whatTheyDo: 'Builds tractors and farm equipment and lends farmers the money to buy them.',
    notSuitable: CAPTIVE_LENDER,
  },
  {
    ticker: 'BA',
    name: 'Boeing',
    group: 'Industrial',
    industry: 'Aerospace',
    whatTheyDo: 'Builds commercial airliners, military aircraft, and space systems.',
  },
  {
    ticker: 'GE',
    name: 'GE Aerospace',
    group: 'Industrial',
    industry: 'Aerospace',
    whatTheyDo: 'Makes jet engines for airliners and earns steady fees servicing them.',
  },
  {
    ticker: 'HON',
    name: 'Honeywell',
    group: 'Industrial',
    industry: 'Industrial technology',
    whatTheyDo: 'Makes aircraft systems, building controls, and factory automation equipment.',
  },
  {
    ticker: 'LMT',
    name: 'Lockheed Martin',
    group: 'Industrial',
    industry: 'Defense',
    whatTheyDo: 'Builds fighter jets, missiles, and satellites, mostly for the U.S. government.',
  },
  {
    ticker: 'UPS',
    name: 'UPS',
    group: 'Industrial',
    industry: 'Package delivery',
    whatTheyDo: 'Picks up and delivers packages with its fleet of brown trucks and cargo planes.',
  },
  {
    ticker: 'FDX',
    name: 'FedEx',
    group: 'Industrial',
    industry: 'Package delivery',
    whatTheyDo: 'Delivers packages overnight by air and by ground across the world.',
  },

  /* ---------------------------------------------------------------- Energy */
  {
    ticker: 'XOM',
    // The SEC ticker list now points XOM at a new holding company with no
    // filing history; Exxon Mobil Corporation's own 10-Ks are under 34088.
    cik: 34088,
    name: 'ExxonMobil',
    group: 'Energy',
    industry: 'Oil & gas',
    whatTheyDo: 'Finds and pumps oil and natural gas, refines it into fuel, and makes chemicals.',
  },
  {
    ticker: 'CVX',
    name: 'Chevron',
    group: 'Energy',
    industry: 'Oil & gas',
    whatTheyDo: 'Produces oil and gas worldwide and runs refineries and gas stations.',
  },
  {
    ticker: 'COP',
    name: 'ConocoPhillips',
    group: 'Energy',
    industry: 'Oil & gas',
    whatTheyDo: 'Explores for and produces oil and natural gas, without the refining side.',
  },
];
