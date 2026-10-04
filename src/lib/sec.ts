/**
 * Reads the figures ClearValue needs out of an SEC EDGAR "company facts"
 * document — the free, keyless JSON the SEC publishes for every filer at
 * https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json
 *
 * Pure functions, no network. `scripts/fetch-sec.ts` does the downloading and
 * hands the parsed JSON to `extractSecRecord`.
 *
 * The rules, in order of importance:
 *
 *   1. Only annual report (10-K) values. Quarterly numbers never leak in.
 *   2. Every figure carries a citation: the XBRL concept, the filing's
 *      accession number, the period it describes and the date it was filed.
 *   3. A figure that cannot be found is left out and listed in `issues`.
 *      Nothing is guessed, defaulted or carried over from another year.
 *   4. Balance-sheet figures (cash, debt) are taken at exactly the same date
 *      the cash-flow year ends, so every number describes the same moment.
 */

export interface SecFact {
  start?: string;
  end: string;
  val: number;
  accn: string;
  fy?: number;
  fp?: string;
  form: string;
  filed: string;
  frame?: string;
}

interface ConceptFacts {
  label?: string;
  units: Record<string, SecFact[]>;
}

export interface CompanyFacts {
  cik: number;
  entityName: string;
  facts: Record<string, Record<string, ConceptFacts>>;
}

/** Where one reported number came from. */
export interface FilingCitation {
  /** XBRL concept, e.g. "us-gaap:NetCashProvidedByUsedInOperatingActivities". */
  concept: string;
  form: string;
  /** Last day of the period the value describes. */
  periodEnd: string;
  filed: string;
  /** EDGAR accession number, e.g. "0000320193-25-000079". */
  accession: string;
}

/** A value plus every filing line that went into it (sums cite each part). */
export interface CitedValue {
  value: number;
  citations: FilingCitation[];
}

export interface SecFigures {
  revenue?: CitedValue;
  operatingIncome?: CitedValue;
  operatingCashFlow?: CitedValue;
  capex?: CitedValue;
  /** Cash and equivalents plus separately reported short-term investments. */
  cash?: CitedValue;
  /** Borrowings only: long-term debt including current maturities, plus short-term borrowings. */
  debt?: CitedValue;
  shares?: CitedValue;
}

export interface SecHistoryPoint {
  periodEnd: string;
  revenue?: number;
  /** Operating cash flow minus capital expenditures. */
  freeCashFlow?: number;
}

export interface SecRecord {
  ticker: string;
  cik: number;
  entityName: string;
  /** End of the latest fiscal year found in a 10-K. */
  periodEnd: string;
  figures: SecFigures;
  /** Oldest first, at most five years. */
  history: SecHistoryPoint[];
  /** Plain-English notes about anything missing or approximated. */
  issues: string[];
}

/* ------------------------------------------------------------ concepts --- */

const OPERATING_CASH_FLOW = [
  'NetCashProvidedByUsedInOperatingActivities',
  'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations',
];

const CAPEX = [
  'PaymentsToAcquirePropertyPlantAndEquipment',
  'PaymentsToAcquireProductiveAssets',
  'PaymentsForCapitalImprovements',
];

const REVENUE = [
  'Revenues',
  'RevenueFromContractWithCustomerExcludingAssessedTax',
  'RevenueFromContractWithCustomerIncludingAssessedTax',
  'SalesRevenueNet',
];

const OPERATING_INCOME = ['OperatingIncomeLoss'];

const CASH = [
  'CashAndCashEquivalentsAtCarryingValue',
  'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents',
  'Cash',
];

const SHORT_TERM_INVESTMENTS = [
  'MarketableSecuritiesCurrent',
  'ShortTermInvestments',
  'AvailableForSaleSecuritiesDebtSecuritiesCurrent',
];

/** Long-term debt *including* its current portion. */
const DEBT_TOTAL_LONG = ['LongTermDebt', 'LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities'];
const DEBT_NONCURRENT = ['LongTermDebtNoncurrent', 'LongTermDebtAndCapitalLeaseObligations'];
/** Every current borrowing, already including commercial paper. */
const DEBT_CURRENT_ALL = ['DebtCurrent'];
const DEBT_CURRENT_LONG = ['LongTermDebtCurrent', 'LongTermDebtAndCapitalLeaseObligationsCurrent'];
const DEBT_SHORT = ['ShortTermBorrowings', 'CommercialPaper'];

const DILUTED_SHARES = ['WeightedAverageNumberOfDilutedSharesOutstanding'];

/* ------------------------------------------------------------- helpers --- */

const DAY = 24 * 60 * 60 * 1000;

function isAnnualReport(fact: SecFact): boolean {
  return fact.form === '10-K' || fact.form === '10-K/A' || fact.form === '10-KT';
}

/** A flow covering roughly one year (52/53-week years included). */
function isFullYear(fact: SecFact): boolean {
  if (!fact.start) return false;
  const days = (Date.parse(fact.end) - Date.parse(fact.start)) / DAY;
  return days >= 340 && days <= 380;
}

function factsFor(
  doc: CompanyFacts,
  concept: string,
  unit: string,
  taxonomy = 'us-gaap',
): SecFact[] {
  const list = doc.facts?.[taxonomy]?.[concept]?.units?.[unit];
  return Array.isArray(list) ? list.filter((f) => Number.isFinite(f.val)) : [];
}

function cite(concept: string, fact: SecFact, taxonomy = 'us-gaap'): FilingCitation {
  return {
    concept: `${taxonomy}:${concept}`,
    form: fact.form,
    periodEnd: fact.end,
    filed: fact.filed,
    accession: fact.accn,
  };
}

/** The most recently filed fact wins, so restatements replace originals. */
function newest(a: SecFact, b: SecFact): SecFact {
  return b.filed > a.filed ? b : a;
}

interface Picked {
  concept: string;
  fact: SecFact;
}

/**
 * Annual values of a flow (revenue, cash flow) keyed by period end. Concepts
 * are tried in priority order; an earlier concept wins for any year it covers,
 * and later concepts fill the years it does not — companies switch tags.
 */
function annualSeries(doc: CompanyFacts, concepts: string[], unit = 'USD'): Map<string, Picked> {
  const series = new Map<string, Picked>();
  for (const concept of concepts) {
    const byEnd = new Map<string, SecFact>();
    for (const fact of factsFor(doc, concept, unit)) {
      if (!isAnnualReport(fact) || !isFullYear(fact)) continue;
      const seen = byEnd.get(fact.end);
      byEnd.set(fact.end, seen ? newest(seen, fact) : fact);
    }
    for (const [end, fact] of byEnd) {
      if (!series.has(end)) series.set(end, { concept, fact });
    }
  }
  return series;
}

/** A balance-sheet value at exactly `periodEnd`, from a 10-K. */
function instantAt(
  doc: CompanyFacts,
  concepts: string[],
  periodEnd: string,
  unit = 'USD',
): Picked | null {
  for (const concept of concepts) {
    let found: SecFact | null = null;
    for (const fact of factsFor(doc, concept, unit)) {
      if (!isAnnualReport(fact) || fact.start || fact.end !== periodEnd) continue;
      found = found ? newest(found, fact) : fact;
    }
    if (found) return { concept, fact: found };
  }
  return null;
}

function single(picked: Picked | null | undefined): CitedValue | undefined {
  if (!picked) return undefined;
  return { value: picked.fact.val, citations: [cite(picked.concept, picked.fact)] };
}

function sum(parts: (Picked | null)[]): CitedValue | undefined {
  const present = parts.filter((p): p is Picked => p !== null);
  if (present.length === 0) return undefined;
  return {
    value: present.reduce((total, p) => total + p.fact.val, 0),
    citations: present.map((p) => cite(p.concept, p.fact)),
  };
}

/* ---------------------------------------------------------- the parts --- */

function extractDebt(doc: CompanyFacts, periodEnd: string, issues: string[]): CitedValue | undefined {
  const short = instantAt(doc, DEBT_SHORT, periodEnd);

  // Preferred: one line holding all long-term debt, plus short-term borrowings.
  const totalLong = instantAt(doc, DEBT_TOTAL_LONG, periodEnd);
  if (totalLong) return sum([totalLong, short]);

  const noncurrent = instantAt(doc, DEBT_NONCURRENT, periodEnd);
  const currentAll = instantAt(doc, DEBT_CURRENT_ALL, periodEnd);
  if (noncurrent && currentAll) return sum([noncurrent, currentAll]);

  const currentLong = instantAt(doc, DEBT_CURRENT_LONG, periodEnd);
  if (noncurrent) {
    if (!currentLong && !short) {
      issues.push('Debt: only the long-term (non-current) portion was found; check for current maturities.');
    }
    return sum([noncurrent, currentLong, short]);
  }

  if (currentAll || currentLong || short) {
    issues.push('Debt: only short-term borrowings were found; check the balance sheet for long-term debt.');
    return sum([currentAll ?? currentLong, currentAll ? null : short]);
  }

  issues.push('Debt: no borrowing lines found in the 10-K. Add the figure by hand if the company has debt.');
  return undefined;
}

function extractShares(doc: CompanyFacts, periodEnd: string, issues: string[]): CitedValue | undefined {
  // Diluted weighted-average shares: one consistent, as-converted count even
  // for companies with several share classes.
  const diluted = annualSeries(doc, DILUTED_SHARES, 'shares').get(periodEnd);
  if (diluted) return single(diluted);

  // Fallback: the cover-page count from the latest 10-K, summed across classes.
  const cover = factsFor(doc, 'EntityCommonStockSharesOutstanding', 'shares', 'dei').filter(
    isAnnualReport,
  );
  if (cover.length === 0) {
    issues.push('Shares: no diluted share count or cover-page count found.');
    return undefined;
  }
  const latestFiled = cover.reduce((a, b) => newest(a, b)).accn;
  const fromFiling = cover.filter((f) => f.accn === latestFiled);
  const latestEnd = fromFiling.reduce((max, f) => (f.end > max ? f.end : max), '');
  const classes = fromFiling.filter((f) => f.end === latestEnd);
  if (classes.length > 1) {
    issues.push(
      `Shares: cover page lists ${classes.length} share classes; they were added together. Check conversion ratios.`,
    );
  }
  return {
    value: classes.reduce((total, f) => total + f.val, 0),
    citations: classes.map((f) => cite('EntityCommonStockSharesOutstanding', f, 'dei')),
  };
}

/* -------------------------------------------------------------- record --- */

const HISTORY_YEARS = 5;

export function extractSecRecord(ticker: string, doc: CompanyFacts): SecRecord | null {
  const issues: string[] = [];

  const ocfSeries = annualSeries(doc, OPERATING_CASH_FLOW);
  if (ocfSeries.size === 0) return null;

  const ends = [...ocfSeries.keys()].sort();
  const periodEnd = ends[ends.length - 1];

  const capexSeries = annualSeries(doc, CAPEX);
  const revenueSeries = annualSeries(doc, REVENUE);
  const opIncomeSeries = annualSeries(doc, OPERATING_INCOME);

  const operatingCashFlow = single(ocfSeries.get(periodEnd));
  const capex = single(capexSeries.get(periodEnd));
  if (!capex) issues.push('Capital expenditures: not found for the latest year, so free cash flow cannot be computed.');

  const revenue = single(revenueSeries.get(periodEnd));
  if (!revenue) issues.push('Revenue: not found for the latest year.');
  const operatingIncome = single(opIncomeSeries.get(periodEnd));
  if (!operatingIncome) issues.push('Operating income: not found for the latest year.');

  const cashOnly = instantAt(doc, CASH, periodEnd);
  if (!cashOnly) issues.push('Cash: no cash-and-equivalents line found at the fiscal year end.');
  const investments = instantAt(doc, SHORT_TERM_INVESTMENTS, periodEnd);
  const cash = cashOnly ? sum([cashOnly, investments]) : undefined;

  const debt = extractDebt(doc, periodEnd, issues);
  const shares = extractShares(doc, periodEnd, issues);

  const history: SecHistoryPoint[] = ends.slice(-HISTORY_YEARS).map((end) => {
    const ocf = ocfSeries.get(end)?.fact.val;
    const cx = capexSeries.get(end)?.fact.val;
    const point: SecHistoryPoint = { periodEnd: end };
    const rev = revenueSeries.get(end)?.fact.val;
    if (rev !== undefined) point.revenue = rev;
    if (ocf !== undefined && cx !== undefined) point.freeCashFlow = ocf - cx;
    return point;
  });

  const figures: SecFigures = {};
  if (revenue) figures.revenue = revenue;
  if (operatingIncome) figures.operatingIncome = operatingIncome;
  if (operatingCashFlow) figures.operatingCashFlow = operatingCashFlow;
  if (capex) figures.capex = capex;
  if (cash) figures.cash = cash;
  if (debt) figures.debt = debt;
  if (shares) figures.shares = shares;

  return { ticker, cik: doc.cik, entityName: doc.entityName, periodEnd, figures, history, issues };
}

/** EDGAR's folder for one filing. Every citation in the UI links here. */
export function filingUrl(cik: number, accession: string): string {
  return `https://www.sec.gov/Archives/edgar/data/${cik}/${accession.replace(/-/g, '')}/`;
}

/** EDGAR's list of a company's annual reports, by ticker. */
export function edgarSearchUrl(ticker: string): string {
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&ticker=${encodeURIComponent(
    ticker.replace('.', '-'),
  )}&type=10-K&dateb=&owner=include&count=10`;
}
