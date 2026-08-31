import { useMemo } from 'react';
import {
  AGGRESSIVE_GROWTH,
  formatDelta,
  formatPerShare,
  formatPercent,
  formatRate,
  impliedGrowth,
  verdictFor,
  type Assumptions,
  type DcfResult,
  type Financials,
} from '../lib/dcf';
import { useCountUp } from '../hooks';
import { Term } from './Term';

interface VerdictProps {
  result: DcfResult;
  financials: Financials;
  assumptions: Assumptions;
  companyName: string;
  /** Data-vintage caption. Null in manual mode, where the figures are the user's. */
  vintage: string | null;
  /** True while the figures behind this result are unverified sample data. */
  isSample: boolean;
}

export function Verdict({
  result,
  financials,
  assumptions,
  companyName,
  vintage,
  isSample,
}: VerdictProps) {
  const fairValue = useCountUp(result.fairValuePerShare);
  const upside = result.upside;
  const verdict = upside === null ? null : verdictFor(upside);
  const down = upside !== null && upside < 0;

  // What growth rate would make today's price exactly right? This is the line
  // that turns "this app says everything is overvalued" into the actual lesson.
  const implied = useMemo(
    () => impliedGrowth(financials, assumptions),
    [financials, assumptions],
  );

  return (
    <section className="verdict" aria-labelledby="verdict-title">
      <div className="fair-value">
        {/* A heading, not a label: it keeps the document outline going
            h1 → h2 → h3 down the page. Styled as an eyebrow. */}
        <h2 className="eyebrow" id="verdict-title">
          Our estimate of what {companyName} is worth
        </h2>
        <span
          className={`hero-number${result.fairValuePerShare < 0 ? ' negative' : ''}`}
          aria-hidden="true"
        >
          {formatPerShare(fairValue)}
        </span>
        <p className="per-share">per share, based on the cash we expect it to generate</p>

        <div className="against-price">
          <span className="price num">
            Market price today: {formatPerShare(result.currentPrice)}
          </span>
          {upside !== null && (
            <span className={`delta-pill${down ? ' down' : ''}`}>
              {formatDelta(upside)}
              <span className="pill-word">{down ? 'below price' : 'above price'}</span>
            </span>
          )}
        </div>

        {implied !== null && (
          <p className="implied num">
            Today&apos;s price implies investors expect about{' '}
            <strong>{formatPercent(implied, 1)}/yr</strong> cash-flow growth. Your current
            assumption: <strong>{formatRate(assumptions.growthRate)}</strong>.
          </p>
        )}

        {vintage && (
          <p className={`vintage${isSample ? ' sample' : ''}`}>
            {isSample && (
              <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M8 1.8 15 14H1z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="M8 6.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11.8" r="0.85" fill="currentColor" />
              </svg>
            )}
            {vintage}
          </p>
        )}

        {/* A printed page has no sliders, so the assumptions behind the figure
            above have to appear as text right beside it. */}
        <p className="print-assumptions num">
          Assumptions: cash growing {formatRate(assumptions.growthRate)} a year for five years,
          discounted at {formatRate(assumptions.discountRate)} a year, then{' '}
          {formatRate(result.effectiveTerminalGrowth)} growth thereafter.
        </p>
      </div>

      {/* The one region screen readers should hear on every recalculation. */}
      <div className="verdict-copy" aria-live="polite" aria-atomic="true">
        {verdict ? (
          <>
            <h3>{verdict.headline}</h3>
            <p>
              Our estimate: {formatPerShare(result.fairValuePerShare)} a share. The market:{' '}
              {formatPerShare(result.currentPrice)}. The gap — what investors call{' '}
              <Term id="upside" /> — is {formatDelta(upside as number)}.
            </p>
            <p>{verdict.body}</p>
            {assumptions.growthRate > AGGRESSIVE_GROWTH && (
              <p>
                These are very aggressive assumptions. Growing free cash{' '}
                <span className="num">{formatRate(assumptions.growthRate)}</span> a year for five
                straight years is rare, even for the fastest-growing companies.
              </p>
            )}
            <p className="nudge">{verdict.nudge}</p>
          </>
        ) : (
          <>
            <h3>No market price to compare against.</h3>
            <p>
              Enter a current share price and we will show you how our estimate stacks up against
              what investors are paying.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
