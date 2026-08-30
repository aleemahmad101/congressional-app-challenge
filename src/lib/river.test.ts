import { describe, expect, it } from 'vitest';
import { runDcf, type Assumptions, type Financials } from './dcf';
import { COMPACT, PLOT, WIDE, barX, niceDivisor, riverGeometry } from './river';

const APPLE_ISH: Financials = {
  fcf0: 108_800_000_000,
  sharesOutstanding: 14_940_000_000,
  cash: 65_200_000_000,
  debt: 106_600_000_000,
  currentPrice: 229.5,
};

const BASE: Assumptions = { growthRate: 0.08, discountRate: 0.09, terminalGrowth: 0.025 };

describe('niceDivisor', () => {
  it('stays at 1 when the terminal bar already fits', () => {
    expect(niceDivisor(0.4)).toBe(1);
    expect(niceDivisor(1)).toBe(1);
  });

  it('rounds up to the next printable number', () => {
    expect(niceDivisor(9.97)).toBe(10);
    expect(niceDivisor(10.01)).toBe(12);
    expect(niceDivisor(5.19)).toBe(6);
    expect(niceDivisor(26.2)).toBe(30);
  });
});

describe('barX', () => {
  it('lays the five years out evenly and pushes the terminal bar clear', () => {
    expect(barX(0)).toBe(PLOT.startX);
    expect(barX(1) - barX(0)).toBe(PLOT.barWidth + PLOT.yearGap);
    expect(barX(5) - (barX(4) + PLOT.barWidth)).toBe(PLOT.separatorGap);
  });

  it('keeps every bar inside the viewBox', () => {
    for (let i = 0; i <= 5; i++) {
      expect(barX(i)).toBeGreaterThanOrEqual(0);
      expect(barX(i) + PLOT.barWidth).toBeLessThanOrEqual(PLOT.width);
    }
  });
});

describe('riverGeometry', () => {
  const geometry = riverGeometry(runDcf(APPLE_ISH, BASE));

  it('produces six bars, the last of which is the terminal value', () => {
    expect(geometry.bars).toHaveLength(6);
    expect(geometry.bars[5].kind).toBe('terminal');
    expect(geometry.bars.filter((b) => b.kind === 'year')).toHaveLength(5);
  });

  it('always draws the discounted fill shorter than its undiscounted ghost', () => {
    for (const bar of geometry.bars) {
      expect(bar.fillFraction).toBeLessThan(bar.ghostFraction);
    }
  });

  it('keeps the terminal bar dominant but on screen', () => {
    const terminal = geometry.bars[5];
    const tallestYear = Math.max(...geometry.bars.slice(0, 5).map((b) => b.ghostFraction));
    expect(terminal.ghostFraction).toBeGreaterThan(tallestYear);
    expect(terminal.ghostFraction).toBeLessThanOrEqual(1);
  });

  it('leaves the year bars readable rather than squashing them flat', () => {
    const tallestYear = Math.max(...geometry.bars.slice(0, 5).map((b) => b.ghostFraction));
    expect(tallestYear).toBeCloseTo(PLOT.yearMaxFraction, 6);
  });

  it('holds those two properties across the whole slider range', () => {
    for (let g = 0; g <= 0.2001; g += 0.02) {
      for (let r = 0.06; r <= 0.1501; r += 0.01) {
        const geo = riverGeometry(runDcf(APPLE_ISH, { ...BASE, growthRate: g, discountRate: r }));
        const terminal = geo.bars[5];
        const tallestYear = Math.max(...geo.bars.slice(0, 5).map((b) => b.ghostFraction));
        expect(terminal.ghostFraction).toBeLessThanOrEqual(1);
        expect(terminal.ghostFraction).toBeGreaterThan(tallestYear);
      }
    }
  });

  it('reports the divisor it used so the chart can label it', () => {
    expect(geometry.divisor).toBeGreaterThan(1);
    expect(Number.isFinite(geometry.divisor)).toBe(true);
  });

  it('brackets the same total the model reports as enterprise value', () => {
    const result = runDcf(APPLE_ISH, BASE);
    expect(geometry.total).toBeCloseTo(result.enterpriseValue, 6);
  });

  it('gives every bar a touch target wider than the bar itself', () => {
    for (const bar of geometry.bars) {
      expect(bar.hitWidth).toBeGreaterThan(PLOT.barWidth);
      expect(bar.hitX).toBeLessThan(bar.x);
    }
  });

  it('never lets two touch targets overlap', () => {
    const sorted = [...geometry.bars].sort((a, b) => a.hitX - b.hitX);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].hitX).toBeGreaterThanOrEqual(sorted[i - 1].hitX + sorted[i - 1].hitWidth);
    }
  });

  it('survives a company with no cash flow at all rather than dividing by zero', () => {
    const geo = riverGeometry(runDcf({ ...APPLE_ISH, fcf0: 0 }, BASE));
    for (const bar of geo.bars) {
      expect(Number.isFinite(bar.ghostFraction)).toBe(true);
      expect(bar.ghostFraction).toBeGreaterThan(0);
    }
  });
});

describe('the compact layout for narrow screens', () => {
  /**
   * A 375px viewport minus the shell's 16px gutters and the figure's 14px
   * padding leaves roughly this much room for the SVG.
   */
  const RENDERED_WIDTH = 315;
  const unitsToPx = (units: number) => (units / COMPACT.width) * RENDERED_WIDTH;

  const geometry = riverGeometry(runDcf(APPLE_ISH, BASE), COMPACT);

  it('keeps every touch target at or above 44 pixels', () => {
    for (const bar of geometry.bars) {
      expect(unitsToPx(bar.hitWidth)).toBeGreaterThanOrEqual(44);
    }
  });

  it('keeps label text above 10 pixels — 15 units in the compact viewBox', () => {
    expect(unitsToPx(15)).toBeGreaterThan(10);
  });

  it('fits every bar inside the narrower viewBox', () => {
    for (const bar of geometry.bars) {
      expect(bar.x).toBeGreaterThanOrEqual(0);
      expect(bar.x + COMPACT.barWidth).toBeLessThanOrEqual(COMPACT.width);
    }
  });

  it('shortens the bar labels so they do not collide', () => {
    expect(geometry.bars[0].label).toBe('Yr 1');
    expect(geometry.bars[5].label).toBe('After yr 5');
  });

  it('drops the per-bar dollar figures, leaving them to the tap tooltip', () => {
    expect(COMPACT.valueY).toBeNull();
    expect(WIDE.valueY).not.toBeNull();
  });

  it('reaches the same numbers as the wide layout — only the drawing changes', () => {
    const wide = riverGeometry(runDcf(APPLE_ISH, BASE), WIDE);
    expect(geometry.divisor).toBe(wide.divisor);
    expect(geometry.total).toBeCloseTo(wide.total, 6);
    geometry.bars.forEach((bar, i) => {
      expect(bar.present).toBeCloseTo(wide.bars[i].present, 6);
      expect(bar.ghostFraction).toBeCloseTo(wide.bars[i].ghostFraction, 6);
    });
  });
});
