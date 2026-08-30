import { useMemo, useState } from 'react';
import { formatBig, formatPercent, formatRate, type DcfResult } from '../lib/dcf';
import {
  COMPACT,
  WIDE,
  type PlotSpec,
  type RiverBar,
  percentX,
  percentY,
  plotHeight,
  riverGeometry,
  topOf,
} from '../lib/river';
import { useMediaQuery, useTweenedList } from '../hooks';
import { Term } from './Term';
import { Walkthrough, type SpotlightRect } from './Walkthrough';

interface RiverOfCashProps {
  result: DcfResult;
  discountRate: number;
  learnMode: boolean;
}

/**
 * The centrepiece. Six bars, each drawn twice: a ghost outline at the cash's
 * full future size, and a solid fill at what that cash is worth today. The
 * gap between them is the whole idea of discounting, made visible.
 */
export function RiverOfCash({ result, discountRate, learnMode }: RiverOfCashProps) {
  // SVG text scales with the viewBox, so narrow screens get a squarer layout
  // rather than a shrunken copy of the wide one.
  const narrow = useMediaQuery('(max-width: 560px)');
  const plot: PlotSpec = narrow ? COMPACT : WIDE;

  const geometry = useMemo(() => riverGeometry(result, plot), [result, plot]);
  const [active, setActive] = useState<string | null>(null);
  const [walkthroughStep, setWalkthroughStep] = useState<number | null>(null);

  // One flat list so ghosts and fills tween on the same clock.
  const targets = geometry.bars.flatMap((bar) => [bar.ghostFraction, bar.fillFraction]);
  const tweened = useTweenedList(targets);
  const height = plotHeight(plot);

  const activeBar = geometry.bars.find((bar) => bar.key === active) ?? null;
  const spotlight =
    walkthroughStep === null ? null : spotlightFor(walkthroughStep, geometry.bars, plot);

  return (
    <section className="river" aria-labelledby="river-title">
      <div className="river-head">
        <div>
          <h3 className="section-title" id="river-title">
            The river of cash
          </h3>
          <p className="lede">
            Every dollar this company is expected to bring in, and what each of those dollars is
            worth to you <em>today</em>.
          </p>
        </div>
        <div className="river-legend" aria-hidden="true">
          <span>
            <i className="legend-swatch ghost" /> Cash in that year
          </span>
          <span>
            <i className="legend-swatch fill" /> Worth today
          </span>
          <span>
            <i className="legend-swatch terminal" /> Everything after year 5
          </span>
        </div>
      </div>

      <figure className="card river-figure">
        <div className="river-plot">
          <svg
            className={plot.compact ? 'compact' : undefined}
            viewBox={`0 0 ${plot.width} ${plot.height}`}
            role="img"
            aria-label={describeChart(result, geometry.divisor)}
          >
            <defs>
              <pattern
                id="hatch"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill="var(--seal-wash)" />
                <rect width="4" height="8" fill="var(--seal)" opacity="0.75" />
              </pattern>
            </defs>

            {geometry.bars.map((bar, i) => {
              const ghost = tweened[i * 2];
              const fill = tweened[i * 2 + 1];
              const dim = active !== null && active !== bar.key;

              return (
                <g key={bar.key} className={`bar-group${dim ? ' dim' : ''}`}>
                  <rect
                    className="bar-ghost"
                    x={bar.x}
                    y={topOf(ghost, plot)}
                    width={plot.barWidth}
                    height={Math.max(1, ghost * height)}
                  />
                  <rect
                    className={`bar-fill${bar.kind === 'terminal' ? ' terminal' : ''}`}
                    x={bar.x}
                    y={topOf(fill, plot)}
                    width={plot.barWidth}
                    height={Math.max(1, fill * height)}
                  />
                  <text className="bar-label" x={bar.centerX} y={plot.labelY}>
                    {bar.label}
                  </text>
                  {plot.valueY !== null && (
                    <text className="bar-value" x={bar.centerX} y={plot.valueY}>
                      {formatBig(bar.present)}
                    </text>
                  )}
                  <rect
                    className="bar-hit"
                    x={bar.hitX}
                    y={plot.top}
                    width={bar.hitWidth}
                    height={plot.baseline - plot.top}
                    tabIndex={0}
                    role="button"
                    aria-label={describeBar(bar, discountRate, geometry.divisor)}
                    onPointerEnter={() => setActive(bar.key)}
                    onPointerLeave={() => setActive((was) => (was === bar.key ? null : was))}
                    onFocus={() => setActive(bar.key)}
                    onBlur={() => setActive((was) => (was === bar.key ? null : was))}
                  />
                </g>
              );
            })}

            {geometry.divisor > 1 && (
              <text
                className="scale-note"
                x={scaleNoteX(geometry.bars[5], plot)}
                y={topOf(tweened[10], plot) - 12}
                textAnchor={plot.compact ? 'end' : 'middle'}
              >
                {plot.compact
                  ? `1/${formatDivisor(geometry.divisor)} scale`
                  : `drawn at 1/${formatDivisor(geometry.divisor)} scale so it fits`}
              </text>
            )}

            <line
              className="axis-line"
              x1={plot.startX - 12}
              y1={plot.baseline}
              x2={plot.width - plot.startX + 12}
              y2={plot.baseline}
            />

            {/* The bracket: everything above it adds up to the figure below it. */}
            <path className="bracket" d={bracketPath(plot)} vectorEffect="non-scaling-stroke" />
            <text className="bracket-label" x={plot.width / 2} y={plot.bracketLabelY}>
              What all that future cash is worth today
            </text>
            <text className="bracket-total" x={plot.width / 2} y={plot.bracketTotalY}>
              {formatBig(result.enterpriseValue)}
            </text>

            {spotlight && (
              <rect
                className="walkthrough-spot"
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.width}
                height={spotlight.height}
              />
            )}
          </svg>

          {activeBar && (
            <div
              className={`river-tooltip${tooltipEdge(activeBar.centerX, plot)}`}
              style={{
                left: `${percentX(activeBar.centerX, plot)}%`,
                top: `${percentY(topOf(Math.max(activeBar.ghostFraction, 0.08), plot) - 10, plot)}%`,
              }}
              role="presentation"
            >
              <strong>{activeBar.label}</strong>
              {describeBar(activeBar, discountRate, geometry.divisor, false)}
            </div>
          )}
        </div>
      </figure>

      <p className="river-foot">
        The outlines show the cash as it arrives. The solid bars show what it is worth once
        discounted back to today at <span className="num">{formatRate(discountRate)}</span> a year.
        The gap between them is the cost of waiting.{' '}
        {geometry.divisor > 1 && (
          <>
            The last bar covers <Term id="terminal-value">every year after year 5</Term>, so it is
            drawn at 1/{formatDivisor(geometry.divisor)} of the others&apos; scale.
          </>
        )}
      </p>

      {learnMode && <Walkthrough step={walkthroughStep} onStepChange={setWalkthroughStep} />}
    </section>
  );
}

/* ------------------------------------------------------------------ bits --- */

function bracketPath(plot: PlotSpec): string {
  const left = plot.startX - 12;
  const right = plot.width - plot.startX + 12;
  const mid = plot.width / 2;
  const arm = plot.compact ? 6 : 10;
  const { bracketY, bracketDropY } = plot;
  return [
    `M${left} ${bracketY - 8}`,
    `V${bracketY}`,
    `H${mid - arm}`,
    `L${mid} ${bracketDropY}`,
    `L${mid + arm} ${bracketY}`,
    `H${right}`,
    `V${bracketY - 8}`,
  ].join(' ');
}

/** On the compact layout the note is right-aligned so it cannot run off the edge. */
function scaleNoteX(terminal: RiverBar, plot: PlotSpec): number {
  return plot.compact ? terminal.x + plot.barWidth : terminal.centerX;
}

function tooltipEdge(centerX: number, plot: PlotSpec): string {
  const pct = percentX(centerX, plot);
  if (pct < 18) return ' at-start';
  if (pct > 82) return ' at-end';
  return '';
}

/** "1/10" reads better than "1/10.0"; halves do come up at low divisors. */
function formatDivisor(divisor: number): string {
  return Number.isInteger(divisor) ? String(divisor) : divisor.toFixed(1);
}

/**
 * `withLabel` is on for the screen-reader label, where the bar's name has to
 * be part of the sentence, and off inside the tooltip, which already shows it
 * as a heading.
 */
function describeBar(
  bar: RiverBar,
  discountRate: number,
  divisor: number,
  withLabel = true,
): string {
  const discounted = `Discounted back to today at ${formatPercent(
    discountRate,
  )} a year, it is worth ${formatBig(bar.present)} now.`;

  if (bar.kind === 'terminal') {
    const scaleNote =
      divisor > 1 ? ` Drawn at 1/${formatDivisor(divisor)} scale so it fits beside the others.` : '';
    const opener = withLabel ? 'Everything after year 5' : 'Every year after this one';
    return `${opener}, rolled into one number: ${formatBig(bar.raw)}. ${discounted}${scaleNote}`;
  }

  const opener = withLabel ? `Year ${bar.year}: we project` : 'We project';
  return `${opener} ${formatBig(bar.raw)} of free cash. ${discounted}`;
}

function describeChart(result: DcfResult, divisor: number): string {
  const years = result.years.map((y) => `year ${y.year}, ${formatBig(y.presentValue)}`).join('; ');
  return `Bar chart of discounted cash flow. In today's money: ${years}; and everything after year 5, ${formatBig(
    result.terminal.presentValue,
  )}${divisor > 1 ? `, drawn at one ${formatDivisor(divisor)}th scale` : ''}. Together they total ${formatBig(
    result.enterpriseValue,
  )}.`;
}

/** Where the guided walkthrough points on each step. */
function spotlightFor(step: number, bars: RiverBar[], plot: PlotSpec): SpotlightRect {
  const pad = 4;
  const height = plotHeight(plot);

  if (step === 0) {
    const bar = bars[2];
    return {
      x: bar.x - pad,
      y: topOf(bar.ghostFraction, plot) - pad,
      width: plot.barWidth + pad * 2,
      height: bar.ghostFraction * height + pad * 2,
    };
  }
  if (step === 1) {
    const bar = bars[4];
    return {
      x: bar.x - pad,
      y: topOf(bar.ghostFraction, plot) - pad,
      width: plot.barWidth + pad * 2,
      height: (bar.ghostFraction - bar.fillFraction) * height + pad * 2,
    };
  }
  return {
    x: plot.startX - 20,
    y: plot.bracketY - 14,
    width: plot.width - 2 * plot.startX + 40,
    height: plot.bracketTotalY - plot.bracketY + 22,
  };
}
