import { describe, expect, it } from 'vitest';
import { extractSecRecord, filingUrl, type CompanyFacts, type SecFact } from './sec';

/**
 * A hand-built company-facts document in the SEC's exact JSON shape. The
 * numbers are invented for the test and describe no real company.
 */
const K24 = { accn: '0000000001-24-000010', form: '10-K', filed: '2024-11-01' };
const K25 = { accn: '0000000001-25-000010', form: '10-K', filed: '2025-11-01' };
const Q25 = { accn: '0000000001-25-000005', form: '10-Q', filed: '2025-08-01' };

const year = (end: string, start: string, val: number, filing = K25): SecFact => ({
  start,
  end,
  val,
  ...filing,
});
const at = (end: string, val: number, filing = K25): SecFact => ({ end, val, ...filing });

function doc(usGaap: Record<string, SecFact[]>, dei: Record<string, SecFact[]> = {}): CompanyFacts {
  const wrap = (facts: Record<string, SecFact[]>, unitFor: (concept: string) => string) =>
    Object.fromEntries(
      Object.entries(facts).map(([concept, list]) => [concept, { units: { [unitFor(concept)]: list } }]),
    );
  return {
    cik: 1,
    entityName: 'TEST CO',
    facts: {
      'us-gaap': wrap(usGaap, (c) => (c.startsWith('WeightedAverage') ? 'shares' : 'USD')),
      dei: wrap(dei, () => 'shares'),
    },
  };
}

const BASE = {
  NetCashProvidedByUsedInOperatingActivities: [
    year('2023-09-30', '2022-10-01', 800, K24),
    year('2024-09-28', '2023-10-01', 900, K24),
    year('2025-09-27', '2024-09-29', 1000),
    // A quarter must never be mistaken for a year.
    year('2025-06-28', '2025-03-30', 260, Q25),
  ],
  PaymentsToAcquirePropertyPlantAndEquipment: [
    year('2023-09-30', '2022-10-01', 100, K24),
    year('2024-09-28', '2023-10-01', 120, K24),
    year('2025-09-27', '2024-09-29', 150),
  ],
  Revenues: [year('2024-09-28', '2023-10-01', 4000, K24)],
  RevenueFromContractWithCustomerExcludingAssessedTax: [
    year('2024-09-28', '2023-10-01', 3999, K24),
    year('2025-09-27', '2024-09-29', 4400),
  ],
  OperatingIncomeLoss: [year('2025-09-27', '2024-09-29', 1100)],
  CashAndCashEquivalentsAtCarryingValue: [at('2024-09-28', 300, K24), at('2025-09-27', 350)],
  MarketableSecuritiesCurrent: [at('2025-09-27', 50)],
  LongTermDebt: [at('2025-09-27', 2000)],
  CommercialPaper: [at('2025-09-27', 100)],
  WeightedAverageNumberOfDilutedSharesOutstanding: [year('2025-09-27', '2024-09-29', 500_000_000)],
};

describe('extractSecRecord', () => {
  const record = extractSecRecord('TEST', doc(BASE))!;

  it('anchors on the latest full fiscal year from a 10-K, ignoring quarters', () => {
    expect(record.periodEnd).toBe('2025-09-27');
    expect(record.figures.operatingCashFlow?.value).toBe(1000);
  });

  it('cites the concept, accession and period behind every figure', () => {
    const [citation] = record.figures.operatingCashFlow!.citations;
    expect(citation).toEqual({
      concept: 'us-gaap:NetCashProvidedByUsedInOperatingActivities',
      form: '10-K',
      periodEnd: '2025-09-27',
      filed: '2025-11-01',
      accession: K25.accn,
    });
  });

  it('falls back to a newer revenue tag when the preferred one stops being used', () => {
    expect(record.figures.revenue?.value).toBe(4400);
    expect(record.figures.revenue?.citations[0].concept).toContain('RevenueFromContract');
  });

  it('adds short-term investments to cash, citing both lines', () => {
    expect(record.figures.cash?.value).toBe(400);
    expect(record.figures.cash?.citations).toHaveLength(2);
  });

  it('counts long-term debt plus commercial paper', () => {
    expect(record.figures.debt?.value).toBe(2100);
  });

  it('uses diluted weighted-average shares for the same year', () => {
    expect(record.figures.shares?.value).toBe(500_000_000);
  });

  it('builds free cash flow history from operating cash flow minus capex', () => {
    expect(record.history.map((h) => h.freeCashFlow)).toEqual([700, 780, 850]);
  });

  it('reports nothing missing when everything is present', () => {
    expect(record.issues).toEqual([]);
  });

  it('leaves a missing figure out and says so instead of guessing', () => {
    const { PaymentsToAcquirePropertyPlantAndEquipment: _capex, LongTermDebt: _debt, CommercialPaper: _cp, ...rest } = BASE;
    const partial = extractSecRecord('TEST', doc(rest))!;
    expect(partial.figures.capex).toBeUndefined();
    expect(partial.figures.debt).toBeUndefined();
    expect(partial.issues.some((i) => i.startsWith('Capital expenditures'))).toBe(true);
    expect(partial.issues.some((i) => i.startsWith('Debt'))).toBe(true);
  });

  it('never takes a balance sheet value from a different date', () => {
    const stale = { ...BASE, CashAndCashEquivalentsAtCarryingValue: [at('2024-09-28', 300, K24)] };
    expect(extractSecRecord('TEST', doc(stale))!.figures.cash).toBeUndefined();
  });

  it('prefers the most recently filed value when a year is restated', () => {
    const restated = {
      ...BASE,
      OperatingIncomeLoss: [
        year('2025-09-27', '2024-09-29', 1100),
        year('2025-09-27', '2024-09-29', 1050, { ...K25, accn: '0000000001-26-000001', filed: '2026-02-01', form: '10-K/A' }),
      ],
    };
    expect(extractSecRecord('TEST', doc(restated))!.figures.operatingIncome?.value).toBe(1050);
  });

  it('sums cover-page share classes when no diluted count exists, and flags it', () => {
    const { WeightedAverageNumberOfDilutedSharesOutstanding: _w, ...rest } = BASE;
    const twoClasses = doc(rest, {
      EntityCommonStockSharesOutstanding: [at('2025-10-20', 300_000_000), at('2025-10-20', 200_000_000)],
    });
    const result = extractSecRecord('TEST', twoClasses)!;
    expect(result.figures.shares?.value).toBe(500_000_000);
    expect(result.issues.some((i) => i.includes('share classes'))).toBe(true);
  });

  it('takes a single all-borrowings line when the filer reports one', () => {
    const combined = { ...BASE, DebtLongtermAndShorttermCombinedAmount: [at('2025-09-27', 2500)] };
    expect(extractSecRecord('TEST', doc(combined))!.figures.debt?.value).toBe(2500);
  });

  it('refuses a diluted share count tagged in millions and uses the cover page', () => {
    const millions = {
      ...BASE,
      WeightedAverageNumberOfDilutedSharesOutstanding: [year('2025-09-27', '2024-09-29', 716.4)],
    };
    const result = extractSecRecord(
      'TEST',
      doc(millions, { EntityCommonStockSharesOutstanding: [at('2025-10-20', 713_000_000)] }),
    )!;
    expect(result.figures.shares?.value).toBe(713_000_000);
    expect(result.issues.some((i) => i.includes('millions'))).toBe(true);
  });

  it('never uses a cover-page share count from a different year', () => {
    const { WeightedAverageNumberOfDilutedSharesOutstanding: _w, ...rest } = BASE;
    const stale = doc(rest, {
      EntityCommonStockSharesOutstanding: [at('2009-11-13', 470_000_000, { ...K24, filed: '2009-11-20' })],
    });
    expect(extractSecRecord('TEST', stale)!.figures.shares).toBeUndefined();
  });

  it('returns null for a filer with no annual cash-flow data', () => {
    expect(extractSecRecord('TEST', doc({}))).toBeNull();
  });
});

describe('filingUrl', () => {
  it('points at the filing folder on EDGAR', () => {
    expect(filingUrl(320193, '0000320193-25-000079')).toBe(
      'https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/',
    );
  });
});
