import { describe, expect, it } from 'vitest';
import { runDcf, type Assumptions, type Financials } from './dcf';
import {
  assumptionDrivers,
  assumptionWarnings,
  describeDriver,
  elasticities,
  valueBridge,
} from './insights';
import { buildSearch, parseRoute } from './url';

/** Test-only figures. */
const F: Financials = {
  fcf0: 1_000_000_000,
  sharesOutstanding: 100_000_000,
  cash: 2_000_000_000,
  debt: 5_000_000_000,
  currentPrice: 150,
};
const START: Assumptions = { growthRate: 0.06, discountRate: 0.09, terminalGrowth: 0.025 };

describe('valueBridge', () => {
  it('adds up exactly to the model’s answer', () => {
    const result = runDcf(F, START);
    const b = valueBridge(F, result);
    expect(b.forecastYears + b.beyondForecast).toBeCloseTo(b.enterpriseValue, 3);
    expect(b.enterpriseValue + b.cash - b.debt).toBeCloseTo(b.equityValue, 3);
    expect(b.equityValue / b.shares).toBeCloseTo(result.fairValuePerShare, 9);
    expect(b.beyondShare).toBeGreaterThan(0.5);
    expect(b.beyondShare).toBeLessThan(1);
  });
});

describe('assumptionDrivers', () => {
  it('is empty when nothing has changed', () => {
    expect(assumptionDrivers(F, START, START)).toEqual([]);
  });

  it('credits higher growth with raising the value and a higher rate with lowering it', () => {
    const now = { ...START, growthRate: 0.1, discountRate: 0.1 };
    const drivers = assumptionDrivers(F, START, now);
    const growth = drivers.find((d) => d.key === 'growthRate')!;
    const rate = drivers.find((d) => d.key === 'discountRate')!;
    expect(growth.effect).toBeGreaterThan(0);
    expect(rate.effect).toBeLessThan(0);
    expect(Math.abs(drivers[0].effect)).toBeGreaterThanOrEqual(Math.abs(drivers[1].effect));
  });

  it('describes each driver in plain words', () => {
    const [d] = assumptionDrivers(F, START, { ...START, discountRate: 0.11 });
    expect(describeDriver(d)).toMatch(/higher discount rate, 11% \(from 9%\).*lowered the estimate/);
  });
});

describe('elasticities', () => {
  it('reports the direction each assumption pushes the value', () => {
    const e = Object.fromEntries(elasticities(F, START).map((x) => [x.key, x.perShare]));
    expect(e.growthRate).toBeGreaterThan(0);
    expect(e.discountRate).toBeLessThan(0);
    expect(e.terminalGrowth).toBeGreaterThan(0);
  });

  it('skips an assumption already at the top of its range', () => {
    const keys = elasticities(F, { ...START, growthRate: 0.2 }).map((x) => x.key);
    expect(keys).not.toContain('growthRate');
  });
});

describe('assumptionWarnings', () => {
  it('stays quiet for ordinary assumptions', () => {
    expect(assumptionWarnings(START, 0.05)).toEqual([]);
  });

  it('flags extreme growth, extreme rates and high long-term growth', () => {
    const keys = assumptionWarnings({ growthRate: 0.18, discountRate: 0.065, terminalGrowth: 0.035 }).map(
      (w) => w.key,
    );
    expect(keys).toEqual(['growthRate', 'discountRate', 'terminalGrowth']);
  });

  it('notices growth far above the company’s own history', () => {
    expect(assumptionWarnings({ ...START, growthRate: 0.12 }, 0.02)[0]?.key).toBe('growthRate');
  });
});

describe('url state', () => {
  it('round-trips a company and its assumptions', () => {
    const route = { company: 'nke', assumptions: { growthRate: 0.075, discountRate: 0.0925, terminalGrowth: 0.02 } };
    expect(parseRoute(buildSearch(route))).toEqual(route);
  });

  it('clamps out-of-range rates and ignores junk', () => {
    expect(parseRoute('?company=aapl&g=5&r=abc&t=-1')).toEqual({
      company: 'aapl',
      assumptions: { growthRate: 0.2, terminalGrowth: 0.01 },
    });
  });

  it('rejects ids that could not be a company', () => {
    expect(parseRoute('?company=<script>')).toEqual({});
  });

  it('round-trips the manual-entry form', () => {
    expect(parseRoute(buildSearch({ manual: true, forCompany: 'tsla' }))).toEqual({
      manual: true,
      forCompany: 'tsla',
    });
  });

  it('builds an empty search for the home page', () => {
    expect(buildSearch({})).toBe('');
  });
});
