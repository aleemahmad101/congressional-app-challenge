import { describe, expect, it } from 'vitest';
import {
  DISCOUNT_RANGE,
  TERMINAL_RANGE,
  clampTerminalGrowth,
  findProblems,
  formatBig,
  formatDelta,
  formatPerShare,
  formatPercent,
  formatRate,
  formatShareCount,
  projectYears,
  runDcf,
  sensitivityGrid,
  terminalValue,
  verdictFor,
  verdictTier,
  type Assumptions,
  type Financials,
} from './dcf';

/**
 * A deliberately clean case. With zero growth and zero terminal growth the
 * whole model collapses to a perpetuity: EV = fcf / r = 100 / 0.10 = 1000.
 * That identity makes the expected numbers checkable by hand.
 */
const FLAT: Financials = {
  fcf0: 100,
  sharesOutstanding: 100,
  cash: 200,
  debt: 300,
  currentPrice: 6,
};

const FLAT_ASSUMPTIONS: Assumptions = {
  growthRate: 0,
  discountRate: 0.1,
  terminalGrowth: 0,
};

describe('projectYears', () => {
  it('compounds growth and discounts each year back to today', () => {
    const years = projectYears(100, 0.1, 0.1);
    expect(years).toHaveLength(5);
    expect(years[0].fcf).toBeCloseTo(110, 10);
    expect(years[4].fcf).toBeCloseTo(161.051, 10);
    // Growth and discount rate cancel exactly, so every year is worth 100 today.
    for (const year of years) expect(year.presentValue).toBeCloseTo(100, 10);
  });

  it('leaves cash flat when growth is zero', () => {
    const years = projectYears(100, 0, 0.09);
    expect(years.every((y) => y.fcf === 100)).toBe(true);
    expect(years[0].discountFactor).toBeCloseTo(1 / 1.09, 12);
  });
});

describe('terminalValue', () => {
  it('applies Gordon growth and discounts five years back', () => {
    const terminal = terminalValue(100, 0.1, 0);
    expect(terminal.value).toBeCloseTo(1000, 10);
    expect(terminal.presentValue).toBeCloseTo(1000 / Math.pow(1.1, 5), 10);
  });

  it('grows the final year before capitalising it', () => {
    const terminal = terminalValue(100, 0.09, 0.025);
    expect(terminal.value).toBeCloseTo((100 * 1.025) / 0.065, 10);
  });
});

describe('runDcf — basic case', () => {
  const result = runDcf(FLAT, FLAT_ASSUMPTIONS);

  it('values the five explicit years and the terminal value', () => {
    expect(result.sumPresentValues).toBeCloseTo(379.0786769, 6);
    expect(result.terminal.presentValue).toBeCloseTo(620.9213231, 6);
  });

  it('sums to the perpetuity identity', () => {
    expect(result.enterpriseValue).toBeCloseTo(1000, 6);
  });

  it('adds cash, subtracts debt, and divides by shares', () => {
    expect(result.equityValue).toBeCloseTo(900, 6);
    expect(result.fairValuePerShare).toBeCloseTo(9, 6);
  });

  it('reports upside against the current price', () => {
    expect(result.upside).toBeCloseTo(0.5, 10);
  });

  it('does not clamp terminal growth when the spread is comfortable', () => {
    expect(result.terminalGrowthClamped).toBe(false);
    expect(result.effectiveTerminalGrowth).toBe(0);
  });

  it('raises fair value when growth rises and lowers it when the discount rate rises', () => {
    const faster = runDcf(FLAT, { ...FLAT_ASSUMPTIONS, growthRate: 0.05 });
    const stricter = runDcf(FLAT, { ...FLAT_ASSUMPTIONS, discountRate: 0.12 });
    expect(faster.fairValuePerShare).toBeGreaterThan(result.fairValuePerShare);
    expect(stricter.fairValuePerShare).toBeLessThan(result.fairValuePerShare);
  });

  it('returns null upside when there is no price to compare against', () => {
    expect(runDcf({ ...FLAT, currentPrice: 0 }, FLAT_ASSUMPTIONS).upside).toBeNull();
  });
});

describe('clamp guardrail', () => {
  it('pulls terminal growth down to keep 1.5 points of spread', () => {
    expect(clampTerminalGrowth(0.02, 0.03)).toBeCloseTo(0.005, 12);
  });

  it('leaves a comfortable spread alone', () => {
    expect(clampTerminalGrowth(0.09, 0.025)).toBe(0.025);
  });

  it('flags the clamp on the result so the UI can explain it', () => {
    const squeezed = runDcf(FLAT, {
      growthRate: 0,
      discountRate: 0.02,
      terminalGrowth: 0.03,
    });
    expect(squeezed.terminalGrowthClamped).toBe(true);
    expect(squeezed.effectiveTerminalGrowth).toBeCloseTo(0.005, 12);
    expect(Number.isFinite(squeezed.fairValuePerShare)).toBe(true);
  });

  it('never needs to clamp anywhere inside the slider ranges', () => {
    for (let r = DISCOUNT_RANGE.min; r <= DISCOUNT_RANGE.max + 1e-9; r += DISCOUNT_RANGE.step) {
      const worstCase = runDcf(FLAT, {
        growthRate: 0,
        discountRate: r,
        terminalGrowth: TERMINAL_RANGE.max,
      });
      expect(worstCase.terminalGrowthClamped).toBe(false);
    }
  });
});

describe('negative equity from debt', () => {
  const drowning = runDcf({ ...FLAT, debt: 5000 }, FLAT_ASSUMPTIONS);

  it('lets equity value go negative rather than hiding it', () => {
    expect(drowning.equityValue).toBeCloseTo(-3800, 6);
    expect(drowning.fairValuePerShare).toBeCloseTo(-38, 6);
  });

  it('still reports a finite, deeply negative upside', () => {
    expect(drowning.upside).toBeLessThan(-1);
    expect(Number.isFinite(drowning.upside as number)).toBe(true);
  });

  it('formats the negative per-share figure with a leading minus', () => {
    expect(formatPerShare(drowning.fairValuePerShare)).toBe('-$38.00');
  });
});

describe('findProblems', () => {
  it('accepts a healthy company', () => {
    expect(findProblems(FLAT)).toEqual([]);
  });

  it('rejects companies that burn cash', () => {
    expect(findProblems({ ...FLAT, fcf0: -500 })).toContain('negative-fcf');
    expect(findProblems({ ...FLAT, fcf0: 0 })).toContain('negative-fcf');
  });

  it('rejects impossible share counts and prices', () => {
    expect(findProblems({ ...FLAT, sharesOutstanding: 0 })).toContain('shares-not-positive');
    expect(findProblems({ ...FLAT, currentPrice: -1 })).toContain('price-not-positive');
  });

  it('rejects negative cash and debt', () => {
    expect(findProblems({ ...FLAT, cash: -1 })).toContain('cash-negative');
    expect(findProblems({ ...FLAT, debt: -1 })).toContain('debt-negative');
  });

  it('ignores fields that have not been filled in yet', () => {
    expect(findProblems({ fcf0: 100 })).toEqual([]);
  });
});

describe('verdicts', () => {
  it('splits on the plus and minus twenty percent bands', () => {
    expect(verdictTier(0.5)).toBe('undervalued');
    expect(verdictTier(0.2)).toBe('fair');
    expect(verdictTier(0)).toBe('fair');
    expect(verdictTier(-0.2)).toBe('fair');
    expect(verdictTier(-0.5)).toBe('overvalued');
  });

  it('always ends with an invitation to move a slider', () => {
    for (const upside of [0.9, 0, -0.9]) {
      expect(verdictFor(upside).nudge.toLowerCase()).toContain('slider');
    }
  });
});

describe('sensitivityGrid', () => {
  const grid = sensitivityGrid(FLAT, { ...FLAT_ASSUMPTIONS, growthRate: 0.06 });

  it('is three by three', () => {
    expect(grid).toHaveLength(3);
    for (const row of grid) expect(row).toHaveLength(3);
  });

  it('marks exactly the centre cell as selected', () => {
    const selected = grid.flat().filter((cell) => cell.selected);
    expect(selected).toHaveLength(1);
    expect(grid[1][1].selected).toBe(true);
  });

  it('rises to the right and falls downward', () => {
    for (const row of grid) {
      expect(row[2].fairValuePerShare).toBeGreaterThan(row[0].fairValuePerShare);
    }
    for (let col = 0; col < 3; col++) {
      expect(grid[2][col].fairValuePerShare).toBeLessThan(grid[0][col].fairValuePerShare);
    }
  });

  it('keeps its cells inside the slider ranges', () => {
    const edge = sensitivityGrid(FLAT, { ...FLAT_ASSUMPTIONS, growthRate: 0, discountRate: 0.06 });
    for (const cell of edge.flat()) {
      expect(cell.growthRate).toBeGreaterThanOrEqual(0);
      expect(cell.discountRate).toBeGreaterThanOrEqual(DISCOUNT_RANGE.min);
    }
  });
});

describe('formatting helpers', () => {
  it('formats billions and trillions to the cent of a unit', () => {
    expect(formatBig(2_410_000_000)).toBe('$2.41B');
    expect(formatBig(3_500_000_000_000)).toBe('$3.50T');
    expect(formatBig(-980_000_000)).toBe('-$980.0M');
  });

  it('drops to one decimal at millions and to whole dollars below', () => {
    expect(formatBig(412_500_000)).toBe('$412.5M');
    expect(formatBig(999_999)).toBe('$999,999');
    expect(formatBig(0)).toBe('$0');
  });

  it('formats per-share values to the cent', () => {
    expect(formatPerShare(187.4159)).toBe('$187.42');
    expect(formatPerShare(1234.5)).toBe('$1,234.50');
    expect(formatPerShare(0)).toBe('$0.00');
  });

  it('formats rates and signed deltas', () => {
    expect(formatPercent(0.0925)).toBe('9.3%');
    expect(formatPercent(0.0925, 2)).toBe('9.25%');
    expect(formatRate(0.09)).toBe('9%');
    expect(formatRate(0.0925)).toBe('9.25%');
    expect(formatRate(0.005)).toBe('0.5%');
    expect(formatDelta(0.2341)).toBe('+23.4%');
    expect(formatDelta(-0.1206)).toBe('-12.1%');
    expect(formatDelta(0)).toBe('+0.0%');
  });

  it('formats share counts without a dollar sign', () => {
    expect(formatShareCount(15_400_000_000)).toBe('15.40B');
  });

  it('degrades to an em dash rather than printing NaN', () => {
    expect(formatBig(NaN)).toBe('—');
    expect(formatPerShare(Infinity)).toBe('—');
    expect(formatPercent(NaN)).toBe('—');
    expect(formatDelta(NaN)).toBe('—');
  });
});
