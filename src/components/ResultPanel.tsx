import { useMemo } from 'react';
import {
  formatBig,
  formatDelta,
  formatPerShare,
  formatRate,
  formatShareCount,
  verdictFor,
  type Assumptions,
  type DcfResult,
  type Financials,
} from '../lib/dcf';
import { valueBridge } from '../lib/insights';
import { useCountUp } from '../hooks';
import { Explain } from './Explain';
import { Term } from './Term';

interface ResultPanelProps {
  name: string;
  result: DcfResult;
  financials: Financials;
  assumptions: Assumptions;
  /** "as of" date for the reference price, when known. */
  priceAsOf: string | null;
  /** Data-vintage caption, or null for hand-entered figures. */
  vintage: string | null;
  isSample: boolean;
}

export const DISCLAIMER =
  'ClearValue is an educational tool, not investment advice. Valuations are estimates based on assumptions and may differ substantially from actual market outcomes.';

/** Stage 5: the estimate, what it compares to, and what it is made of. */
export function ResultPanel({
  name,
  result,
  financials,
  assumptions,
  priceAsOf,
  vintage,
  isSample,
}: ResultPanelProps) {
  const shown = useCountUp(result.fairValuePerShare, 260);
  const upside = result.upside;
  const verdict = upside === null ? null : verdictFor(upside);
  const negative = result.fairValuePerShare < 0;

  return (
    <div className="result">
      <div className="card result-card">
        <div className="result-main">
          <p className="eyebrow">Your estimate</p>
          <p className="result-lead">
            Based on your assumptions, {name}’s estimated value in today’s dollars is
          </p>
          <p className={`hero-number num${negative ? ' negative' : ''}`} aria-hidden="true">
            {formatPerShare(shown)}
          </p>
          <p className="per-share">
            per share · {formatBig(result.equityValue)} for the whole company
          </p>

          {result.currentPrice !== null && upside !== null && (
            <dl className="compare">
              <div>
                <dt>
                  <Term id="reference-price">Reference share price</Term>
                  {priceAsOf && <span className="compare-date"> ({priceAsOf})</span>}
                </dt>
                <dd className="num">{formatPerShare(result.currentPrice)}</dd>
              </div>
              <div>
                <dt>Your estimated value</dt>
                <dd className="num">{formatPerShare(result.fairValuePerShare)}</dd>
              </div>
              <div>
                <dt>Difference</dt>
                <dd>
                  <span className={`delta-pill${upside < 0 ? ' down' : ''}`}>
                    {formatDelta(upside)}
                    <span className="pill-word">{upside < 0 ? 'below price' : 'above price'}</span>
                  </span>
                </dd>
              </div>
            </dl>
          )}

          <p className="print-assumptions num">
            Assumptions: cash growing {formatRate(assumptions.growthRate)} a year for five years,
            discounted at {formatRate(assumptions.discountRate)} a year, then{' '}
            {formatRate(result.effectiveTerminalGrowth)} growth thereafter.
          </p>
        </div>

        {/* The one region screen readers hear when the answer changes. */}
        <div className="result-copy" aria-live="polite" aria-atomic="true">
          {negative ? (
            <>
              <h3>Debt outweighs the cash this business is expected to produce.</h3>
              <p>
                On these assumptions, what the company owes is larger than everything its future
                cash is worth today, so nothing is left over for shareholders. Try a lower discount
                rate or higher growth to see what you would have to believe.
              </p>
            </>
          ) : verdict ? (
            <>
              <h3>{verdict.headline}</h3>
              <p>{verdict.body}</p>
              <p className="nudge">{verdict.nudge}</p>
            </>
          ) : (
            <>
              <h3>Estimate: {formatPerShare(result.fairValuePerShare)} a share.</h3>
              <p>
                No reference share price is recorded for this company, so there is nothing to
                compare against — the estimate stands on your assumptions alone.
              </p>
            </>
          )}
        </div>
      </div>

      <Composition financials={financials} result={result} />

      {vintage && (
        <p className={`vintage${isSample ? ' sample' : ''}`}>
          {isSample && (
            <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 1.8 15 14H1z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8 6.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11.8" r="0.85" fill="currentColor" />
            </svg>
          )}
          {vintage}
        </p>
      )}

      <p className="disclaimer-note" role="note">
        {DISCLAIMER}
      </p>
    </div>
  );
}

/* --------------------------------------------------------- composition --- */

interface Step {
  key: string;
  label: React.ReactNode;
  value: number;
  kind: 'add' | 'subtract' | 'total';
  /** Running total before and after this step. */
  from: number;
  to: number;
}

function Composition({ financials, result }: { financials: Financials; result: DcfResult }) {
  const bridge = useMemo(() => valueBridge(financials, result), [financials, result]);

  const steps: Step[] = useMemo(() => {
    const ev = bridge.enterpriseValue;
    const withCash = ev + bridge.cash;
    return [
      { key: 'years', label: 'Cash from years 1–5, in today’s dollars', value: bridge.forecastYears, kind: 'add', from: 0, to: bridge.forecastYears },
      { key: 'beyond', label: 'Everything after year 5, in today’s dollars', value: bridge.beyondForecast, kind: 'add', from: bridge.forecastYears, to: ev },
      { key: 'ev', label: <Term id="enterprise-value">Value of the business</Term>, value: ev, kind: 'total', from: 0, to: ev },
      { key: 'cash', label: 'Plus cash it already holds', value: bridge.cash, kind: 'add', from: ev, to: withCash },
      { key: 'debt', label: <>Minus <Term id="total-debt">debt</Term> it owes</>, value: bridge.debt, kind: 'subtract', from: withCash, to: bridge.equityValue },
      { key: 'equity', label: <Term id="equity-value">Value for shareholders</Term>, value: bridge.equityValue, kind: 'total', from: 0, to: bridge.equityValue },
    ];
  }, [bridge]);

  const lo = Math.min(0, ...steps.map((s) => Math.min(s.from, s.to)));
  const hi = Math.max(...steps.map((s) => Math.max(s.from, s.to)), 1);
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;

  return (
    <figure className="card composition">
      <figcaption>
        <h3 className="group-title">How your estimate is built</h3>
        <Explain>
          Read it top to bottom. Most of the value usually comes from after year 5 — here it is{' '}
          <strong>{Math.round(bridge.beyondShare * 100)}%</strong> of the business’s value. That is
          why the long-term assumptions matter so much.
        </Explain>
      </figcaption>

      <dl className="waterfall">
        {steps.map((s) => {
          const left = pct(Math.min(s.from, s.to));
          const width = Math.max(0.6, Math.abs(pct(s.to) - pct(s.from)));
          const sign = s.kind === 'subtract' ? '−' : s.kind === 'add' && s.key !== 'years' ? '+' : '';
          return (
            <div className={`waterfall-row ${s.kind}`} key={s.key}>
              <dt>{s.label}</dt>
              <dd>
                <span className="waterfall-track">
                  <span
                    className={`waterfall-bar ${s.kind}${s.to < 0 ? ' negative' : ''}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </span>
                <span className="num waterfall-value">
                  {sign}
                  {formatBig(Math.abs(s.value) * (s.kind === 'total' && s.value < 0 ? -1 : 1))}
                </span>
              </dd>
            </div>
          );
        })}
        <div className="waterfall-row per-share-row">
          <dt>
            Divided by <Term id="shares-outstanding">{formatShareCount(bridge.shares)} shares</Term>
          </dt>
          <dd>
            <span className="num waterfall-value strong">{formatPerShare(bridge.perShare)} a share</span>
          </dd>
        </div>
      </dl>
    </figure>
  );
}
