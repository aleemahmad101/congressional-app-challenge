import { describe, expect, it } from 'vitest';
import type { SecRecord } from '../lib/sec';
import { CATALOG, SAMPLE_DATA } from './catalog';
import {
  COMPANIES,
  DERIVED_GROWTH_BAND,
  FALLBACK_GROWTH,
  POPULAR_COMPANIES,
  READY_COMPANIES,
  companyId,
  countByGroup,
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
          currentPrice: 42,
          fiscalYear: 'FY2025',
          snapshotDate: '2026-01-05',
          sources: { fcfSource: 'x', sharesSource: 'x', priceAsOf: '2026-01-05' },
        },
      }),
      record(),
    );
    expect(c.reported.freeCashFlow?.value).toBe(800);
    expect(c.reported.price?.value).toBe(42);
    expect(c.reported.price?.provenance).toEqual({ kind: 'manual', source: 'Share price', asOf: '2026-01-05' });
  });

  it('labels sample hand entries as sample, never as reported', () => {
    const c = resolveCompany(
      profile({
        hand: {
          fcf0: 10,
          sharesOutstanding: 1,
          cash: 0,
          debt: 0,
          currentPrice: 5,
          fiscalYear: SAMPLE_DATA,
          snapshotDate: SAMPLE_DATA,
          sources: { fcfSource: '', sharesSource: '', priceAsOf: '' },
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

describe('companyId', () => {
  it('makes share-class tickers URL safe', () => {
    expect(companyId('BRK.B')).toBe('brk-b');
  });
});
