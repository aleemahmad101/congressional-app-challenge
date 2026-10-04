import { describe, expect, it } from 'vitest';
import type { SecRecord } from '../lib/sec';
import { runDcf } from '../lib/dcf';
import { CATALOG, SAMPLE_DATA } from './catalog';
import {
  COMPANIES,
  DERIVED_GROWTH_BAND,
  FALLBACK_GROWTH,
  POPULAR_COMPANIES,
  READY_COMPANIES,
  companyId,
  countByGroup,
  formatPriceDate,
  startingYearCheck,
  priceComparison,
  referencePriceDate,
  historicalGrowth,
  resolveCompany,
  searchCompanies,
} from './companies';
import { SECTOR_GROUPS, type CompanyProfile } from './types';

const profile = (extra: Partial<CompanyProfile> = {}): CompanyProfile => ({
  ticker: 'TST',
  name: 'Test Co',
  group: 'Technology',
  industry: 'Testing',
  whatTheyDo: 'Exists only in tests.',
  ...extra,
});

/** A test-only SEC record. Invented figures. */
const record = (overrides: Partial<SecRecord['figures']> = {}): SecRecord => {
  const cite = (concept: string) => [
    { concept: `us-gaap:${concept}`, form: '10-K', periodEnd: '2025-12-31', filed: '2026-02-01', accession: '0000000001-26-000001' },
  ];
  return {
    ticker: 'TST',
    cik: 1,
    entityName: 'TEST CO',
    periodEnd: '2025-12-31',
    figures: {
      operatingCashFlow: { value: 1000, citations: cite('NetCashProvidedByUsedInOperatingActivities') },
      capex: { value: 200, citations: cite('PaymentsToAcquirePropertyPlantAndEquipment') },
      cash: { value: 300, citations: cite('CashAndCashEquivalentsAtCarryingValue') },
      debt: { value: 400, citations: cite('LongTermDebt') },
      shares: { value: 100, citations: cite('WeightedAverageNumberOfDilutedSharesOutstanding') },
      ...overrides,
    },
    history: [
      { periodEnd: '2021-12-31', freeCashFlow: 500 },
      { periodEnd: '2025-12-31', freeCashFlow: 800 },
    ],
    issues: [],
  };
};

describe('catalog', () => {
  it('offers a broad, recognisable set of companies', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(50);
    expect(CATALOG.length).toBeLessThanOrEqual(75);
  });

  it('has one entry per ticker', () => {
    const tickers = CATALOG.map((c) => c.ticker);
    expect(new Set(tickers).size).toBe(tickers.length);
    expect(new Set(COMPANIES.map((c) => c.id)).size).toBe(COMPANIES.length);
  });

  it('covers every sector filter', () => {
    const counts = countByGroup();
    for (const group of SECTOR_GROUPS) expect(counts[group]).toBeGreaterThan(0);
  });

  it('only suggests beginner companies that can actually be valued', () => {
    for (const c of POPULAR_COMPANIES) expect(c.status).toBe('ready');
  });

  it('produces finite model inputs for every ready company', () => {
    for (const c of READY_COMPANIES) {
      const f = c.financials!;
      for (const value of [f.fcf0, f.sharesOutstanding, f.cash, f.debt]) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });
});

describe('resolveCompany', () => {
  it('marks a company with no figures as needing them, and invents nothing', () => {
    const c = resolveCompany(profile());
    expect(c.status).toBe('needs-figures');
    expect(c.financials).toBeNull();
    expect(c.reported).toEqual({});
    expect(c.missing).toContain('Free cash flow');
  });

  it('computes free cash flow from the filing and cites both lines', () => {
    const c = resolveCompany(profile(), record());
    expect(c.status).toBe('ready');
    expect(c.reported.freeCashFlow?.value).toBe(800);
    const p = c.reported.freeCashFlow!.provenance;
    expect(p.kind).toBe('filing');
    if (p.kind === 'filing') expect(p.concepts).toHaveLength(2);
  });

  it('lets filing data win over hand-entered figures', () => {
    const c = resolveCompany(
      profile({
        hand: {
          fcf0: 9999,
          fiscalYear: 'FY2025',
          snapshotDate: '2026-01-05',
          sources: { fcfSource: 'x', sharesSource: 'x' },
        },
      }),
      record(),
    );
    expect(c.reported.freeCashFlow?.value).toBe(800);
  });

  it('records the reference price as a dated closing price, separate from filings', () => {
    const c = resolveCompany(profile({ referencePrice: 42.5, referencePriceDate: '2026-10-02' }), record());
    expect(c.reported.price).toEqual({
      value: 42.5,
      provenance: { kind: 'market', date: '2026-10-02', priceType: 'Regular-session closing price', currency: 'USD' },
    });
    expect(c.financials?.currentPrice).toBe(42.5);
    expect(referencePriceDate(c)).toBe('2026-10-02');
  });

  it('ignores a price without a date rather than inventing one', () => {
    const c = resolveCompany(profile({ referencePrice: 42.5 }), record());
    expect(c.reported.price).toBeUndefined();
    expect(c.financials?.currentPrice).toBeNull();
    expect(priceComparison(c, false)).toBeNull();
  });

  it('never lets the reference price change the estimate', () => {
    const withPrice = resolveCompany(profile({ referencePrice: 1, referencePriceDate: '2026-10-02' }), record());
    const without = resolveCompany(profile(), record());
    const a = { growthRate: 0.05, discountRate: 0.09, terminalGrowth: 0.025 };
    expect(runDcf(withPrice.financials!, a).fairValuePerShare).toBe(runDcf(without.financials!, a).fairValuePerShare);
  });

  it('labels values computed from several filing lines as calculated, single lines as reported', () => {
    const c = resolveCompany(profile(), record());
    const fcf = c.reported.freeCashFlow!.provenance;
    const debt = c.reported.debt!.provenance;
    expect(fcf.kind === 'filing' && fcf.derived).toBe(true);
    expect(debt.kind === 'filing' && debt.derived).toBe(false);
  });

  it('labels sample hand entries as sample, never as reported', () => {
    const c = resolveCompany(
      profile({
        hand: {
          fcf0: 10,
          sharesOutstanding: 1,
          cash: 0,
          debt: 0,
          fiscalYear: SAMPLE_DATA,
          snapshotDate: SAMPLE_DATA,
          sources: { fcfSource: '', sharesSource: '' },
        },
      }),
    );
    expect(c.usesSample).toBe(true);
    expect(c.reported.freeCashFlow?.provenance.kind).toBe('sample');
  });

  it('values a company without a price but leaves the comparison empty', () => {
    const c = resolveCompany(profile(), record());
    expect(c.financials?.currentPrice).toBeNull();
  });

  it('refuses to value a company that burns cash', () => {
    const burning = record();
    burning.figures.capex = { ...burning.figures.capex!, value: 5000 };
    const c = resolveCompany(profile(), burning);
    expect(c.status).toBe('negative-fcf');
    expect(c.financials).toBeNull();
  });

  it('explains instead of valuing businesses the model does not fit', () => {
    const c = resolveCompany(profile({ notSuitable: 'Banks are different.' }), record());
    expect(c.status).toBe('not-suitable');
    expect(c.financials).toBeNull();
  });

  it('flags a missing debt figure rather than assuming zero', () => {
    const r = record();
    delete r.figures.debt;
    const c = resolveCompany(profile(), r);
    expect(c.status).toBe('needs-figures');
    expect(c.missing).toEqual(['Total debt']);
  });
});

describe('starting growth', () => {
  it('prefers an editor’s choice', () => {
    const c = resolveCompany(profile({ startingGrowth: 0.07 }), record());
    expect(c.startingGrowth).toMatchObject({ value: 0.07, basis: 'editor' });
  });

  it('derives from reported history, kept inside a sensible band', () => {
    const c = resolveCompany(profile(), record());
    // 500 → 800 over four years ≈ 12.5%, capped to the band's top.
    expect(c.startingGrowth.basis).toBe('history');
    expect(c.startingGrowth.value).toBeCloseTo(DERIVED_GROWTH_BAND.max, 5);
  });

  it('falls back to a neutral default without history', () => {
    expect(resolveCompany(profile()).startingGrowth).toMatchObject({ value: FALLBACK_GROWTH, basis: 'default' });
  });

  it('needs at least two positive years to call a trend', () => {
    expect(historicalGrowth([{ periodEnd: '2025-01-01', freeCashFlow: 5 }], 'freeCashFlow')).toBeNull();
    expect(
      historicalGrowth(
        [
          { periodEnd: '2023-01-01', freeCashFlow: 100 },
          { periodEnd: '2025-01-01', freeCashFlow: 121 },
        ],
        'freeCashFlow',
      )?.rate,
    ).toBeCloseTo(0.1, 2);
  });
});

describe('searchCompanies', () => {
  it('finds by ticker, exact ticker first', () => {
    expect(searchCompanies('ko')[0].ticker).toBe('KO');
    expect(searchCompanies('NVDA')[0].ticker).toBe('NVDA');
  });

  it('finds by name, ignoring case and punctuation', () => {
    expect(searchCompanies('mcdonalds')[0].ticker).toBe('MCD');
    expect(searchCompanies('coca')[0].ticker).toBe('KO');
  });

  it('finds by industry and what the company sells', () => {
    expect(searchCompanies('semiconductors').map((c) => c.ticker)).toContain('NVDA');
    expect(searchCompanies('coffee').map((c) => c.ticker)).toContain('SBUX');
  });

  it('filters by sector group', () => {
    const energy = searchCompanies('', undefined, 'Energy');
    expect(energy.length).toBeGreaterThan(0);
    expect(energy.every((c) => c.group === 'Energy')).toBe(true);
  });

  it('does not match descriptions on one or two letters', () => {
    expect(searchCompanies('zz')).toEqual([]);
  });
});

describe('reference prices', () => {
  it('formats the price date the same way everywhere', () => {
    expect(formatPriceDate('2026-10-02')).toBe('Oct. 2, 2026');
    expect(formatPriceDate('2026-05-14')).toBe('May 14, 2026');
    expect(formatPriceDate('2026-09-30')).toBe('Sept. 30, 2026');
  });

  it('dates every comparison label', () => {
    const c = resolveCompany(profile({ referencePrice: 10, referencePriceDate: '2026-10-02' }), record());
    expect(priceComparison(c, true)).toEqual({
      label: 'Reference market price (Oct. 2, 2026)',
      phrase: 'the market price on Oct. 2, 2026',
      date: 'Oct. 2, 2026',
    });
  });

  it('gives each beginner company a dated reference price', () => {
    for (const c of POPULAR_COMPANIES) {
      expect(c.reported.price?.value).toBeGreaterThan(0);
      expect(referencePriceDate(c)).toBe('2026-10-02');
    }
  });

  it('never describes a price as live or current', () => {
    const c = resolveCompany(profile({ referencePrice: 10, referencePriceDate: '2026-10-02' }), record());
    const text = JSON.stringify(priceComparison(c, true));
    expect(text).not.toMatch(/live|current|today/i);
  });
});

describe('startingYearCheck', () => {
  const years = (...fcf: number[]) =>
    fcf.map((freeCashFlow, i) => ({ periodEnd: `${2021 + i}-12-31`, freeCashFlow }));

  it('flags a latest year far below the usual level', () => {
    expect(startingYearCheck(years(11, 9.5, 9.7, 4.7, 5.3))).toMatchObject({
      direction: 'below',
      latest: 5.3,
      priorYears: 4,
    });
  });

  it('flags a latest year far above the usual level too', () => {
    expect(startingYearCheck(years(8, 4, 27, 61, 97))?.direction).toBe('above');
  });

  it('stays quiet for a steady company', () => {
    expect(startingYearCheck(years(10, 10.5, 11, 11.4, 12))).toBeNull();
  });

  it('needs at least three earlier years', () => {
    expect(startingYearCheck(years(10, 10, 2))).toBeNull();
  });

  it('flags Coca-Cola, whose 10-K reports one-time payments in both recent years', () => {
    const ko = COMPANIES.find((c) => c.ticker === 'KO')!;
    expect(startingYearCheck(ko.history)?.direction).toBe('below');
    expect(ko.filingNote?.quote).toContain('fairlife');
  });
});

describe('companyId', () => {
  it('makes share-class tickers URL safe', () => {
    expect(companyId('BRK.B')).toBe('brk-b');
  });
});
