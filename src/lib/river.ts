/**
 * Geometry for the River of Cash.
 *
 * Kept separate from the component and free of React so the two awkward parts
 * are testable:
 *
 * 1. A terminal value roughly sixteen times taller than any single year has to
 *    share a baseline with those years. The honest way to do that is NOT a
 *    second hidden axis: the five year bars set the scale, the terminal bar is
 *    drawn to that same scale divided by a round number, and the chart states
 *    the divisor on screen.
 * 2. SVG text scales with the viewBox, so a 900-unit-wide chart squeezed into a
 *    343px phone would render its labels at four pixels. Narrow screens get a
 *    second, squarer layout rather than a shrunken copy of the wide one.
 */

import type { DcfResult } from './dcf';

export interface PlotSpec {
  width: number;
  height: number;
  /** Top of the plot area. */
  top: number;
  /** Where every bar sits. */
  baseline: number;
  barWidth: number;
  yearGap: number;
  /** Extra air between year 5 and the terminal bar. */
  separatorGap: number;
  startX: number;
  /** Share of the plot height the tallest year bar occupies. */
  yearMaxFraction: number;
  /** Ceiling for the terminal bar. */
  terminalMaxFraction: number;
  labelY: number;
  /** Per-bar dollar figures. Omitted on the compact layout. */
  valueY: number | null;
  bracketY: number;
  bracketDropY: number;
  bracketLabelY: number;
  bracketTotalY: number;
  /** Compact swaps in shorter bar labels and a terser scale note. */
  compact: boolean;
}

export const WIDE: PlotSpec = {
  width: 900,
  height: 430,
  top: 40,
  baseline: 300,
  barWidth: 112,
  yearGap: 26,
  separatorGap: 60,
  startX: 32,
  yearMaxFraction: 0.62,
  terminalMaxFraction: 0.98,
  labelY: 322,
  valueY: 340,
  bracketY: 360,
  bracketDropY: 376,
  bracketLabelY: 394,
  bracketTotalY: 416,
  compact: false,
};

/**
 * For screens under ~560px. Bars are 52 units wide in a 420-unit box, so at a
 * typical 315px rendered width each bar plus its gap is a 47px touch target,
 * and 15-unit label text lands at about 11px.
 */
export const COMPACT: PlotSpec = {
  width: 420,
  height: 460,
  top: 44,
  baseline: 300,
  barWidth: 52,
  yearGap: 11,
  separatorGap: 24,
  startX: 20,
  yearMaxFraction: 0.62,
  terminalMaxFraction: 0.98,
  labelY: 322,
  valueY: null,
  bracketY: 344,
  bracketDropY: 360,
  bracketLabelY: 382,
  bracketTotalY: 414,
  compact: true,
};

/** The wide layout is the default everything else is measured against. */
export const PLOT = WIDE;

/** Usable vertical space for bars, in viewBox units. */
export function plotHeight(plot: PlotSpec = PLOT): number {
  return plot.baseline - plot.top;
}

/** Divisors we are willing to print next to the terminal bar. */
const NICE_DIVISORS = [
  1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200, 300, 500,
  1000,
];

/** Smallest round divisor that brings the terminal bar back inside the plot. */
export function niceDivisor(ideal: number): number {
  if (!Number.isFinite(ideal) || ideal <= 1) return 1;
  return NICE_DIVISORS.find((d) => d >= ideal) ?? Math.ceil(ideal);
}

/** Left edge of a bar. Index 0-4 are the years, index 5 is the terminal bar. */
export function barX(index: number, plot: PlotSpec = PLOT): number {
  const { startX, barWidth, yearGap, separatorGap } = plot;
  if (index < 5) return startX + index * (barWidth + yearGap);
  return startX + 5 * (barWidth + yearGap) - yearGap + separatorGap;
}

export interface RiverBar {
  key: string;
  kind: 'year' | 'terminal';
  /** 1-5 for the projected years; undefined for the terminal bar. */
  year?: number;
  label: string;
  x: number;
  centerX: number;
  /** Widened past the bar itself so the touch target clears 44px. */
  hitX: number;
  hitWidth: number;
  /** Height of the full, undiscounted bar as a fraction of the plot. */
  ghostFraction: number;
  /** Height of the discounted bar as a fraction of the plot. */
  fillFraction: number;
  /** Undiscounted dollars. */
  raw: number;
  /** Dollars in today's money. */
  present: number;
}

export interface RiverGeometry {
  plot: PlotSpec;
  bars: RiverBar[];
  /** The terminal bar is drawn at 1/divisor of the year bars' scale. */
  divisor: number;
  /** Sum of every present value on the chart — the bracket total. */
  total: number;
}

/** A hair of height so a zero bar still shows a baseline tick rather than vanishing. */
const MIN_FRACTION = 0.002;

export function riverGeometry(result: DcfResult, plot: PlotSpec = PLOT): RiverGeometry {
  const yearMax = Math.max(...result.years.map((y) => y.fcf));
  const usable = Number.isFinite(yearMax) && yearMax > 0;

  const scale = (value: number, divisor = 1) =>
    usable
      ? Math.max(MIN_FRACTION, (plot.yearMaxFraction * value) / (yearMax * divisor))
      : MIN_FRACTION;

  // How far past the plot ceiling the terminal bar would reach at year scale.
  const idealDivisor = usable
    ? (plot.yearMaxFraction * result.terminal.value) / (plot.terminalMaxFraction * yearMax)
    : 1;
  const divisor = niceDivisor(idealDivisor);

  const pad = plot.yearGap / 2;
  const hit = (x: number) => ({ hitX: x - pad, hitWidth: plot.barWidth + pad * 2 });

  const bars: RiverBar[] = result.years.map((year, i) => {
    const x = barX(i, plot);
    return {
      key: `year-${year.year}`,
      kind: 'year',
      year: year.year,
      label: plot.compact ? `Yr ${year.year}` : `Year ${year.year}`,
      x,
      centerX: x + plot.barWidth / 2,
      ...hit(x),
      ghostFraction: Math.min(1, scale(year.fcf)),
      fillFraction: Math.min(1, scale(year.presentValue)),
      raw: year.fcf,
      present: year.presentValue,
    };
  });

  const terminalX = barX(5, plot);
  bars.push({
    key: 'terminal',
    kind: 'terminal',
    label: plot.compact ? 'After yr 5' : 'Beyond year 5',
    x: terminalX,
    centerX: terminalX + plot.barWidth / 2,
    ...hit(terminalX),
    ghostFraction: Math.min(1, scale(result.terminal.value, divisor)),
    fillFraction: Math.min(1, scale(result.terminal.presentValue, divisor)),
    raw: result.terminal.value,
    present: result.terminal.presentValue,
  });

  return { plot, bars, divisor, total: result.enterpriseValue };
}

/** Pixel top edge of a bar drawn at `fraction` of the plot height. */
export function topOf(fraction: number, plot: PlotSpec = PLOT): number {
  return plot.baseline - fraction * plotHeight(plot);
}

/** Percent coordinates for HTML layers sitting on top of the SVG. */
export function percentX(x: number, plot: PlotSpec = PLOT): number {
  return (x / plot.width) * 100;
}

export function percentY(y: number, plot: PlotSpec = PLOT): number {
  return (y / plot.height) * 100;
}
