import {
  AGGRESSIVE_GROWTH,
  formatDelta,
  formatPerShare,
  formatRate,
  verdictFor,
  type Assumptions,
  type DcfResult,
} from '../lib/dcf';
import { useCountUp } from '../hooks';
import { Term } from './Term';

interface VerdictProps {
  result: DcfResult;
  assumptions: Assumptions;
  companyName: string;
}

export function Verdict({ result, assumptions, companyName }: VerdictProps) {
  const { growthRate } = assumptions;
  const fairValue = useCountUp(result.fairValuePerShare);
  const upside = result.upside;
  const verdict = upside === null ? null : verdictFor(upside);
  const down = upside !== null && upside < 0;

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
        <p className="per-share">
          per share, based on the cash we expect it to generate
        </p>

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

        {/* A printed page has no sliders, so the assumptions behind the figure
            above have to appear as text right beside it. */}
        <p className="print-assumptions num">
          Assumptions: cash growing {formatRate(growthRate)} a year for five years, discounted at{' '}
          {formatRate(assumptions.discountRate)} a year, then {formatRate(
            result.effectiveTerminalGrowth,
          )}{' '}
          growth thereafter.
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
              <Term id="upside" /> — is {formatDelta(upside as number)}. {verdict.body}
            </p>
            {growthRate > AGGRESSIVE_GROWTH && (
              <p>
                These are very aggressive assumptions. Growing free cash{' '}
                <span className="num">{formatRate(growthRate)}</span> a year for five straight years
                is rare, even for the fastest-growing companies.
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
