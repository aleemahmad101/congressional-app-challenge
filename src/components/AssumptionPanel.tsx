import { useMemo } from 'react';
import {
  DISCOUNT_RANGE,
  GROWTH_RANGE,
  MIN_TERMINAL_SPREAD,
  TERMINAL_RANGE,
  formatPercent,
  formatRate,
  type Assumptions,
  type DcfResult,
} from '../lib/dcf';
import { assumptionWarnings } from '../lib/insights';
import type { HistoricalGrowth } from '../data/companies';
import type { StartingGrowth } from '../data/types';
import { Explain } from './Explain';
import { Slider } from './Slider';
import { Term } from './Term';

interface AssumptionPanelProps {
  assumptions: Assumptions;
  start: Assumptions;
  onChange: (next: Assumptions) => void;
  onReset: () => void;
  result: DcfResult;
  /** Reported growth trends, when the company has history. */
  fcfTrend: HistoricalGrowth | null;
  revenueTrend: HistoricalGrowth | null;
  startingGrowth: StartingGrowth | null;
}

export function AssumptionPanel({
  assumptions,
  start,
  onChange,
  onReset,
  result,
  fcfTrend,
  revenueTrend,
  startingGrowth,
}: AssumptionPanelProps) {
  const set = (patch: Partial<Assumptions>) => onChange({ ...assumptions, ...patch });
  const warnings = useMemo(
    () => assumptionWarnings(assumptions, fcfTrend?.rate ?? null),
    [assumptions, fcfTrend],
  );
  const warningFor = (key: keyof Assumptions) => warnings.find((w) => w.key === key)?.message ?? null;
  const changed =
    assumptions.growthRate !== start.growthRate ||
    assumptions.discountRate !== start.discountRate ||
    assumptions.terminalGrowth !== start.terminalGrowth;

  return (
    <div className="card assumptions">
      <div className="assumptions-head">
        <p className="legend-note">
          <span className="assumption-tag">Your assumption</span> Gold means it is your call — not a
          reported fact. Move anything; the estimate updates instantly.
        </p>
        <button type="button" className="btn ghost small" onClick={onReset} disabled={!changed}>
          Reset to starting point
        </button>
      </div>

      <Slider
        label="Cash-flow growth, years 1–5"
        hint={
          <>
            How quickly do you think this company’s <Term id="free-cash-flow" /> will grow each
            year? Large, settled companies usually land between 2% and 8%.
          </>
        }
        value={assumptions.growthRate}
        min={GROWTH_RANGE.min}
        max={GROWTH_RANGE.max}
        step={GROWTH_RANGE.step}
        start={start.growthRate}
        onChange={(growthRate) => set({ growthRate })}
        ariaValueText={`${formatPercent(assumptions.growthRate, 1)} growth per year`}
        warning={warningFor('growthRate')}
        context={
          <dl className="context-list">
            <div>
              <dt>Starting point</dt>
              <dd className="num">{formatRate(start.growthRate)}</dd>
            </div>
            {fcfTrend && (
              <div>
                <dt>Reported free cash flow trend</dt>
                <dd className="num">
                  {formatPercent(fcfTrend.rate, 1)}/yr over {fcfTrend.years} yr
                  {fcfTrend.years === 1 ? '' : 's'}
                </dd>
              </div>
            )}
            {revenueTrend && (
              <div>
                <dt>Reported revenue trend</dt>
                <dd className="num">
                  {formatPercent(revenueTrend.rate, 1)}/yr over {revenueTrend.years} yr
                  {revenueTrend.years === 1 ? '' : 's'}
                </dd>
              </div>
            )}
            {startingGrowth && <p className="context-note">{startingGrowth.note}</p>}
          </dl>
        }
      />

      <Slider
        label="Discount rate (your required return)"
        hint={
          <>
            Future money is worth less than money today. The <Term id="discount-rate" /> shrinks
            future cash back into today’s dollars — higher means you are more impatient, or the
            company is riskier. U.S. stocks have returned about 9% a year over the long run.
          </>
        }
        value={assumptions.discountRate}
        min={DISCOUNT_RANGE.min}
        max={DISCOUNT_RANGE.max}
        step={DISCOUNT_RANGE.step}
        start={start.discountRate}
        onChange={(discountRate) => set({ discountRate })}
        ariaValueText={`${formatPercent(assumptions.discountRate, 2)} required return per year`}
        warning={warningFor('discountRate')}
      />

      <Slider
        label="Long-term growth after year 5"
        hint={
          <>
            <Term id="terminal-growth">Terminal growth</Term> is how fast the business may grow
            forever once our detailed forecast ends. It has to stay low — nothing outgrows the whole
            economy indefinitely.
          </>
        }
        value={assumptions.terminalGrowth}
        min={TERMINAL_RANGE.min}
        max={TERMINAL_RANGE.max}
        step={TERMINAL_RANGE.step}
        start={start.terminalGrowth}
        onChange={(terminalGrowth) => set({ terminalGrowth })}
        ariaValueText={`${formatPercent(assumptions.terminalGrowth, 2)} growth per year forever`}
        warning={warningFor('terminalGrowth')}
      />

      {result.terminalGrowthClamped && (
        <p className="notice warn" role="status">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5v4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.4" r="0.9" fill="currentColor" />
          </svg>
          <span>
            Long-term growth must stay meaningfully below the discount rate — otherwise the maths
            implies the company grows faster than the economy forever. We are using{' '}
            <span className="num">{formatRate(result.effectiveTerminalGrowth)}</span> instead, which
            keeps {formatPercent(MIN_TERMINAL_SPREAD, 1)} of room.
          </span>
        </p>
      )}

      <Explain as="div" className="explainer">
        <h3>Why five years? Why discount at all?</h3>
        <p>
          Nobody can guess a company’s cash flow twenty years out, so we forecast five years in
          detail and roll everything after that into one figure. We shrink each future year because
          money later is worth less than money now — you could have invested it, and you might not
          get it at all.
        </p>
      </Explain>
    </div>
  );
}
