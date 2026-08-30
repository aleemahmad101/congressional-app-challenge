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
import { Slider } from './Slider';
import { Term } from './Term';

interface AssumptionPanelProps {
  assumptions: Assumptions;
  onChange: (next: Assumptions) => void;
  result: DcfResult;
  learnMode: boolean;
}

export function AssumptionPanel({
  assumptions,
  onChange,
  result,
  learnMode,
}: AssumptionPanelProps) {
  const set = (patch: Partial<Assumptions>) => onChange({ ...assumptions, ...patch });

  return (
    <section className="card assumptions" aria-labelledby="assumptions-title">
      <h3 className="eyebrow" id="assumptions-title">
        Your two assumptions
      </h3>

      <Slider
        label={<>How fast does its cash grow, each year for five years?</>}
        hint={
          <>
            How much more <Term id="free-cash-flow" /> the company generates each year. Most large,
            settled companies land between 2% and 8%.
          </>
        }
        value={assumptions.growthRate}
        min={GROWTH_RANGE.min}
        max={GROWTH_RANGE.max}
        step={GROWTH_RANGE.step}
        onChange={(growthRate) => set({ growthRate })}
        ariaValueText={`${formatPercent(assumptions.growthRate, 1)} growth per year`}
      />

      <Slider
        label={<>What return would you need to tie your money up here?</>}
        hint={
          <>
            The <Term id="discount-rate" />. Higher means you are more impatient, or you think this
            company&apos;s future is less certain. The U.S. stock market has returned around 9% a
            year over the long run.
          </>
        }
        value={assumptions.discountRate}
        min={DISCOUNT_RANGE.min}
        max={DISCOUNT_RANGE.max}
        step={DISCOUNT_RANGE.step}
        onChange={(discountRate) => set({ discountRate })}
        ariaValueText={`${formatPercent(assumptions.discountRate, 2)} required return per year`}
      />

      <details className="advanced">
        <summary>Advanced: growth after year five</summary>
        <Slider
          label={<>How fast does it grow forever after that?</>}
          hint={
            <>
              <Term id="terminal-growth">Terminal growth</Term> has to stay low — nothing outgrows
              the whole economy indefinitely.
            </>
          }
          value={assumptions.terminalGrowth}
          min={TERMINAL_RANGE.min}
          max={TERMINAL_RANGE.max}
          step={TERMINAL_RANGE.step}
          onChange={(terminalGrowth) => set({ terminalGrowth })}
          ariaValueText={`${formatPercent(assumptions.terminalGrowth, 2)} growth per year forever`}
        />
      </details>

      {result.terminalGrowthClamped && (
        <p className="notice warn" role="status">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5v4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.4" r="0.9" fill="currentColor" />
          </svg>
          <span>
            Terminal growth must stay meaningfully below the discount rate — otherwise the maths
            implies the company grows faster than the economy forever. We are using{' '}
            <span className="num">{formatRate(result.effectiveTerminalGrowth)}</span> instead, which
            keeps {formatPercent(MIN_TERMINAL_SPREAD, 1)} of room.
          </span>
        </p>
      )}

      {learnMode && (
        <div className="explainer">
          <h3>Why five years? Why discount at all?</h3>
          <p>
            Nobody can guess a company&apos;s cash flow twenty years out, so we forecast five years
            in detail and roll everything after that into one figure. We shrink each future year
            because money later is worth less than money now — you could have invested it, and you
            might not get it at all.
          </p>
          <p>
            That is the entire method. Professionals use bigger spreadsheets, but the shape of the
            model is exactly what you see on this page.
          </p>
        </div>
      )}
    </section>
  );
}
