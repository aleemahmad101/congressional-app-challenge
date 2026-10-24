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
  {
    ticker: 'INTU',
    name: 'Intuit',
    group: 'Technology',
    industry: 'Financial software',
    whatTheyDo: 'Makes TurboTax, QuickBooks, and Credit Karma, mostly sold as yearly subscriptions.',
  },
  {
    ticker: 'UBER',
    name: 'Uber',
    group: 'Technology',
    industry: 'Ride-hailing & delivery',
    whatTheyDo: 'Connects riders with drivers and diners with restaurants through the Uber and Uber Eats apps.',
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
    // FY2025 10-K, Note on financing: "$798 million of short-term borrowings
    // ... were classified as Long-term debt on the Consolidated Balance Sheet".
    // Commercial paper is already inside LongTermDebt, so it is not added again.
    secDebtLines: ['LongTermDebt'],
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
    filingNote: {
      quote:
        'Additionally, the activity in 2025 included $6.1 billion of the $6.2 billion final milestone payment for fairlife. The activity in 2024 included the $6.0 billion IRS Tax Litigation Deposit.',
      source: 'Coca-Cola FY2025 10-K, “Cash Flows from Operating Activities”',
    },
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
    ticker: 'LULU',
    name: 'Lululemon',
    group: 'Consumer',
    industry: 'Athletic apparel',
    whatTheyDo: 'Designs and sells yoga pants, leggings, and other workout clothes in its own stores and online.',
    // The FY2025 10-K (0001397187-26-000020) reports no borrowings:
    // LineOfCredit and OtherBorrowings are both $0 at Feb. 1, 2026.
    hand: {
      debt: 0,
      fiscalYear: 'FY2025',
      snapshotDate: '2026-10-24',
      sources: {
        fcfSource:
          'Lululemon FY2025 10-K: no debt — revolving credit facility and other borrowings both $0 at Feb. 1, 2026',
        sharesSource: '',
      },
      filingUrl: 'https://www.sec.gov/Archives/edgar/data/1397187/000139718726000020/',
    },
  },
  {
    ticker: 'HSY',
    name: 'Hershey',
    group: 'Consumer',
    industry: 'Candy & snacks',
    whatTheyDo: 'Makes Hershey’s chocolate, Reese’s, Kit Kat (in the U.S.), and salty snacks like SkinnyPop.',
    // Structured data gives the diluted count only per share class. FY2025
    // 10-K (0001628280-26-008586): "The computation of diluted earnings per
    // share for Common Stock assumes the conversion of Class B common stock"
    // — 203,379,000 diluted Common Stock shares.
    hand: {
      sharesOutstanding: 203_379_000,
      fiscalYear: 'FY2025',
      snapshotDate: '2026-10-24',
      sources: {
        fcfSource: '',
        sharesSource:
          'Hershey FY2025 10-K, earnings per share: diluted Common Stock weighted-average shares, assuming Class B converts, 203.4 million',
      },
      filingUrl: 'https://www.sec.gov/Archives/edgar/data/47111/000162828026008586/',
    },
  },
  {
    ticker: 'ABNB',
    name: 'Airbnb',
    group: 'Consumer',
    industry: 'Travel',
    whatTheyDo: 'Runs the app where people rent out their homes and rooms to travelers, taking a fee on each stay.',
    // The FY2025 10-K (0001559720-26-000004) has no separate capital
    // expenditure line; investing activities show only short-term
    // investments and "Other investing activities, net" ($46M). That whole
    // line is subtracted, which can only understate free cash flow.
    hand: {
      fcf0: 4_646_000_000 - 46_000_000,
      fiscalYear: 'FY2025',
      snapshotDate: '2026-10-24',
      sources: {
        fcfSource:
          'Airbnb FY2025 10-K, cash flow statement: cash from operations $4,646M minus all of “Other investing activities, net” $46M (capital spending is not reported separately)',
        sharesSource: '',
      },
      filingUrl: 'https://www.sec.gov/Archives/edgar/data/1559720/000155972026000004/',
    },
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
    // Visa's structured data gives share counts only per share class. Its
    // FY2025 10-K (0001403161-25-000089), Note 1, "Earnings per share":
    // "Diluted class A common stock earnings per share calculation includes
    // the assumed conversion of any class B-1, B-2 and C common stock and
    // participating securities on an as-converted basis" — 1,966 million.
    hand: {
      sharesOutstanding: 1_966_000_000,
      fiscalYear: 'FY2025',
      snapshotDate: '2026-10-24',
      sources: {
        fcfSource: '',
        sharesSource:
          'Visa FY2025 10-K, earnings per share: diluted class A weighted-average shares, as-converted (all share classes), 1,966 million',
      },
      filingUrl: 'https://www.sec.gov/Archives/edgar/data/1403161/000140316125000089/',
    },
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
    ticker: 'SPGI',
    name: 'S&P Global',
    group: 'Finance',
    industry: 'Credit ratings & data',
    whatTheyDo: 'Rates the debt of companies and governments and runs the S&P 500 stock index.',
  },
  {
    ticker: 'MCO',
    name: 'Moody’s',
    group: 'Finance',
    industry: 'Credit ratings & data',
    whatTheyDo: 'Rates how likely borrowers are to repay their debts and sells financial data and research.',
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
  {
    ticker: 'ABT',
    name: 'Abbott',
    group: 'Healthcare',
    industry: 'Medical devices',
    whatTheyDo: 'Makes heart devices, diabetes glucose monitors, lab tests, and nutrition products like Ensure.',
  },
  {
    ticker: 'AMGN',
    name: 'Amgen',
    group: 'Healthcare',
    industry: 'Biotechnology',
    whatTheyDo: 'Develops biotech medicines for bone loss, cholesterol, cancer, and inflammation.',
  },
  {
    ticker: 'TMO',
    name: 'Thermo Fisher Scientific',
    group: 'Healthcare',
    industry: 'Lab equipment',
    whatTheyDo: 'Sells the instruments, chemicals, and services scientists and drug companies use in their labs.',
  },

  /* ------------------------------------------------------------ Industrial */
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
  {
    ticker: 'UNP',
    name: 'Union Pacific',
    group: 'Industrial',
    industry: 'Railroads',
    whatTheyDo: 'Runs freight trains across 23 western states, hauling grain, coal, cars, and shipping containers.',
  },
  {
    ticker: 'WM',
    name: 'Waste Management',
    group: 'Industrial',
    industry: 'Waste & recycling',
    whatTheyDo: 'Collects garbage and recycling from homes and businesses and runs the landfills it goes to.',
  },
  {
    ticker: 'RTX',
    name: 'RTX',
    group: 'Industrial',
    industry: 'Aerospace & defense',
    whatTheyDo: 'Builds Pratt & Whitney jet engines, Collins aircraft parts, and Raytheon missile-defense systems.',
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
    // ConocoPhillips tags its capital spending with its own XBRL element,
    // which the SEC's standard data leaves out. FY2025 10-K
    // (0001163165-26-000009), consolidated statement of cash flows:
    // cash from operating activities $19,796M, "Capital expenditures and
    // investments" $12,553M (cop:PaymentToAcquireProductiveAssetsAndInvestments).
    hand: {
      fcf0: 19_796_000_000 - 12_553_000_000,
      fiscalYear: 'FY2025',
      snapshotDate: '2026-10-24',
      sources: {
        fcfSource:
          'ConocoPhillips FY2025 10-K, cash flow statement: cash from operations $19,796M minus capital expenditures and investments $12,553M',
        sharesSource: '',
      },
      filingUrl: 'https://www.sec.gov/Archives/edgar/data/1163165/000116316526000009/',
    },
  },
];
