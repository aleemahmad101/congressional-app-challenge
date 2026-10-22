import { describe, expect, it } from 'vitest';
import { runDcf, type Assumptions, type Financials } from './dcf';
import { buildChallenge } from './predict';

const financials: Financials = {
  fcf0: 10_000_000_000,
  sharesOutstanding: 1_000_000_000,
  cash: 20_000_000_000,
  debt: 30_000_000_000,
  currentPrice: null,
};
const assumptions: Assumptions = { growthRate: 0.06, discountRate: 0.09, terminalGrowth: 0.025 };

describe('predict, then reveal', () => {
  it('asks all three questions for an ordinary company', () => {
    expect(buildChallenge(financials, assumptions).map((q) => q.id)).toEqual([
      'discount',
      'growth-vs-forever',
      'pay-debt',
    ]);
  });

  it('starts every reveal from the visitor’s own estimate', () => {
    const now = runDcf(financials, assumptions).fairValuePerShare;
    for (const q of buildChallenge(financials, assumptions)) {
      expect(q.bars[0].value).toBeCloseTo(now, 6);
    }
  });

  it('a higher required return lowers the estimate', () => {
    const [q] = buildChallenge(financials, assumptions);
    expect(q.correct).toBe('fall');
    expect(q.tryIt).toEqual({ discountRate: 0.1 });
    expect(q.bars[1].value).toBeLessThan(q.bars[0].value);
  });

  it('asks about a lower return when a higher one is off the slider', () => {
    const [q] = buildChallenge(financials, { ...assumptions, discountRate: 0.145 });
    expect(q.correct).toBe('rise');
    expect(q.prompt).toMatch(/lower return/);
  });

  it('computes which kind of growth matters more from the model', () => {
    const q = buildChallenge(financials, assumptions)[1];
    const [, five, forever] = q.bars;
    expect(q.correct).toBe(forever.value > five.value ? 'forever' : 'five');
    expect(q.correct).toBe('forever');
  });

  it('skips the growth question when terminal growth cannot rise', () => {
    const atTop = buildChallenge(financials, { ...assumptions, terminalGrowth: 0.035 });
    const tooClose = buildChallenge(financials, { ...assumptions, discountRate: 0.06, terminalGrowth: 0.04 });
    for (const challenge of [atTop, tooClose]) {
      expect(challenge.map((q) => q.id)).not.toContain('growth-vs-forever');
    }
  });

  it('paying debt with cash leaves the estimate unchanged', () => {
    const q = buildChallenge(financials, assumptions)[2];
    expect(q.correct).toBe('same');
    expect(q.prompt).toContain('$15.00B');
    expect(q.bars[1].value).toBeCloseTo(q.bars[0].value, 6);
  });

  it('skips the debt question for a company with no debt', () => {
    const ids = buildChallenge({ ...financials, debt: 0 }, assumptions).map((q) => q.id);
    expect(ids).not.toContain('pay-debt');
  });
});
