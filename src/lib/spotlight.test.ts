import { describe, expect, it } from 'vitest';
import { COMPANIES, type Company } from '../data/companies';
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

const DEFAULTS = {
  growthRate: 0.06,
  discountRate: DEFAULT_DISCOUNT_RATE,
  terminalGrowth: DEFAULT_TERMINAL_GROWTH,
};

describe('openingAssumptions', () => {
  it('uses the company’s own growth with the app’s default rates', () => {
    const apple = COMPANIES[0];
    expect(openingAssumptions(apple)).toEqual({
      growthRate: apple.defaultGrowth,
      discountRate: DEFAULT_DISCOUNT_RATE,
      terminalGrowth: DEFAULT_TERMINAL_GROWTH,
    });
  });
});

describe('rankByNeutrality', () => {
  it('orders the whole bundle by distance from a neutral verdict', () => {
    const ranked = rankByNeutrality();
    expect(ranked).toHaveLength(COMPANIES.length);
    const distances = ranked.map((c) => Math.abs(openingUpside(c) ?? Infinity));
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
    }
  });

  it('does not mutate the input array', () => {
    const before = COMPANIES.map((c) => c.id);
    rankByNeutrality();
    expect(COMPANIES.map((c) => c.id)).toEqual(before);
  });

  it('pushes companies it cannot price to the back instead of dropping them', () => {
    const unpriceable: Company = { ...COMPANIES[0], id: 'unpriceable', currentPrice: 0 };
    const ranked = rankByNeutrality([...COMPANIES, unpriceable]);
    expect(ranked).toHaveLength(COMPANIES.length + 1);
    expect(ranked[ranked.length - 1].id).toBe('unpriceable');
  });
});

describe('suggestedCompanies', () => {
  it('offers three by default, nearest-to-neutral first', () => {
    const suggested = suggestedCompanies();
    expect(suggested).toHaveLength(3);
    expect(suggested[0].id).toBe(neutralCompany()?.id);
  });

  it('leads with a company that is not in a deeply negative verdict', () => {
    // The whole point: a first-time visitor must not land on "68% overvalued".
    const first = suggestedCompanies()[0];
    const upside = openingUpside(first);
    expect(upside).not.toBeNull();
    expect(Math.abs(upside as number)).toBeLessThan(
      Math.max(...COMPANIES.map((c) => Math.abs(openingUpside(c) ?? 0))),
    );
  });

  it('is computed, not hardcoded — reordering the input changes nothing', () => {
    const reversed = suggestedCompanies(3, [...COMPANIES].reverse());
    expect(reversed[0].id).toBe(suggestedCompanies()[0].id);
  });
});

describe('shareReadingExpensive', () => {
  it('returns a fraction between zero and one', () => {
    const share = shareReadingExpensive(DEFAULTS);
    expect(share).toBeGreaterThanOrEqual(0);
    expect(share).toBeLessThanOrEqual(1);
  });

  it('counts exactly the companies below the negative band', () => {
    const expected =
      COMPANIES.filter((c) => {
        const upside = runDcf(c, { ...DEFAULTS, growthRate: c.defaultGrowth }).upside;
        return upside !== null && upside < -UPSIDE_BAND;
      }).length / COMPANIES.length;
    expect(shareReadingExpensive(DEFAULTS)).toBeCloseTo(expected, 10);
  });

  it('rises as the discount rate gets stricter', () => {
    const lenient = shareReadingExpensive({ ...DEFAULTS, discountRate: 0.06 });
    const strict = shareReadingExpensive({ ...DEFAULTS, discountRate: 0.15 });
    expect(strict).toBeGreaterThanOrEqual(lenient);
  });

  it('handles an empty bundle without dividing by zero', () => {
    expect(shareReadingExpensive(DEFAULTS, [])).toBe(0);
  });
});

describe('assumptionsAreStrict', () => {
  it('fires when seven in ten or more read expensive', () => {
    expect(assumptionsAreStrict({ ...DEFAULTS, discountRate: 0.15 })).toBe(true);
  });

  it('stays quiet when the assumptions are generous', () => {
    expect(assumptionsAreStrict({ ...DEFAULTS, discountRate: 0.06 }, [])).toBe(false);
  });
});
