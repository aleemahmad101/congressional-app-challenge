import { describe, expect, it } from 'vitest';
import { resolveCompany, type Company } from '../data/companies';
import type { CompanyProfile } from '../data/types';
import { DEFAULT_DISCOUNT_RATE, DEFAULT_TERMINAL_GROWTH, UPSIDE_BAND, runDcf } from './dcf';
import {
  assumptionsAreStrict,
  neutralCompany,
  openingAssumptions,
  openingUpside,
  rankByNeutrality,
  shareReadingExpensive,
  suggestedCompanies,
} from './spotlight';

/** Test-only companies. Invented figures, never shipped. */
function fake(ticker: string, price: number | undefined, growth = 0.06): Company {
  const profile: CompanyProfile = {
    ticker,
    name: `Test ${ticker}`,
    group: 'Consumer',
    industry: 'Testing',
    whatTheyDo: 'Exists only in tests.',
    startingGrowth: growth,
    referencePrice: price,
    referencePriceDate: price === undefined ? undefined : '2026-10-02',
    hand: {
      fcf0: 1_000_000_000,
      sharesOutstanding: 100_000_000,
      cash: 0,
      debt: 0,
      fiscalYear: 'FY2025',
      snapshotDate: '2026-01-01',
      sources: { fcfSource: 'test', sharesSource: 'test' },
    },
  };
  return resolveCompany(profile);
}

// Fair value at 6% growth, 9% discount, 2.5% terminal is ≈ $193 a share.
const BUNDLE = [fake('AAA', 400), fake('BBB', 190), fake('CCC', 120), fake('DDD', 900), fake('EEE', 50)];

const DEFAULTS = {
  growthRate: 0.06,
  discountRate: DEFAULT_DISCOUNT_RATE,
  terminalGrowth: DEFAULT_TERMINAL_GROWTH,
};

describe('openingAssumptions', () => {
  it('uses the company’s own starting growth with the app’s default rates', () => {
    const company = fake('XYZ', 100, 0.08);
    expect(openingAssumptions(company)).toEqual({
      growthRate: 0.08,
      discountRate: DEFAULT_DISCOUNT_RATE,
      terminalGrowth: DEFAULT_TERMINAL_GROWTH,
    });
  });
});

describe('rankByNeutrality', () => {
  it('orders companies by distance from a neutral verdict', () => {
    const ranked = rankByNeutrality(BUNDLE);
    expect(ranked).toHaveLength(BUNDLE.length);
    const distances = ranked.map((c) => Math.abs(openingUpside(c) ?? Infinity));
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
    }
    expect(ranked[0].ticker).toBe('BBB');
  });

  it('does not mutate the input array', () => {
    const before = BUNDLE.map((c) => c.id);
    rankByNeutrality(BUNDLE);
    expect(BUNDLE.map((c) => c.id)).toEqual(before);
  });

  it('pushes companies without a price to the back instead of dropping them', () => {
    const ranked = rankByNeutrality([fake('NOP', undefined), ...BUNDLE]);
    expect(ranked).toHaveLength(BUNDLE.length + 1);
    expect(ranked[ranked.length - 1].ticker).toBe('NOP');
  });
});

describe('suggestedCompanies', () => {
  it('offers three by default, nearest-to-neutral first', () => {
    const suggested = suggestedCompanies(3, BUNDLE);
    expect(suggested).toHaveLength(3);
    expect(suggested[0].id).toBe(neutralCompany(BUNDLE)?.id);
  });

  it('is computed, not hardcoded — reordering the input changes nothing', () => {
    expect(suggestedCompanies(3, [...BUNDLE].reverse())[0].id).toBe(suggestedCompanies(3, BUNDLE)[0].id);
  });
});

describe('shareReadingExpensive', () => {
  it('counts exactly the priced companies below the negative band', () => {
    const expected =
      BUNDLE.filter((c) => {
        const upside = runDcf(c.financials!, { ...DEFAULTS, growthRate: c.startingGrowth.value }).upside;
        return upside !== null && upside < -UPSIDE_BAND;
      }).length / BUNDLE.length;
    expect(shareReadingExpensive(DEFAULTS, BUNDLE)).toBeCloseTo(expected, 10);
  });

  it('ignores companies with no recorded price', () => {
    const withUnpriced = [...BUNDLE, fake('NOP', undefined)];
    expect(shareReadingExpensive(DEFAULTS, withUnpriced)).toBeCloseTo(
      shareReadingExpensive(DEFAULTS, BUNDLE),
      10,
    );
  });

  it('rises as the discount rate gets stricter', () => {
    const lenient = shareReadingExpensive({ ...DEFAULTS, discountRate: 0.06 }, BUNDLE);
    const strict = shareReadingExpensive({ ...DEFAULTS, discountRate: 0.15 }, BUNDLE);
    expect(strict).toBeGreaterThanOrEqual(lenient);
  });

  it('handles an empty bundle without dividing by zero', () => {
    expect(shareReadingExpensive(DEFAULTS, [])).toBe(0);
  });
});

describe('assumptionsAreStrict', () => {
  it('fires when seven in ten or more read expensive', () => {
    expect(assumptionsAreStrict({ ...DEFAULTS, discountRate: 0.15 }, BUNDLE)).toBe(true);
  });

  it('stays quiet when there is nothing to compare', () => {
    expect(assumptionsAreStrict({ ...DEFAULTS, discountRate: 0.06 }, [])).toBe(false);
  });
});
