import { COMPANIES, READY_COMPANIES } from '../data/companies';

/**
 * The first five seconds: what this is, why it matters, what to do, and
 * what you will learn.
 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow">Financial literacy, one company at a time</p>
        <h1 id="hero-title" className="hero-title">
          What is a company <em>actually</em> worth?
        </h1>
        <p className="hero-sub">
          Build a five-year forecast of the cash a real business can generate, then bring it back
          to today&apos;s dollars — the same method professionals use, explained step by step. No
          finance degree required.
        </p>
        <div className="hero-actions">
          <a className="btn btn-lg" href="#companies">
            Value a company
            <span aria-hidden="true"> →</span>
          </a>
          <a className="btn btn-lg ghost" href="#how-it-works">
            How it works
          </a>
        </div>
        <p className="hero-meta">
          {READY_COMPANIES.length > 0
            ? `${READY_COMPANIES.length} companies ready to value`
            : `${COMPANIES.length} companies`}{' '}
          · free · no account · nothing to install
        </p>
      </div>

      <div className="hero-learn card">
        <p className="eyebrow">In about five minutes you will learn</p>
        <ol className="learn-list">
          <li>
            <strong>Where a company&apos;s cash comes from</strong>
            <span>and why “free cash flow” matters more than headline sales.</span>
          </li>
          <li>
            <strong>Why a dollar later is worth less than a dollar today</strong>
            <span>— the single idea behind every valuation.</span>
          </li>
          <li>
            <strong>Why value is a range, not one magic number</strong>
            <span>and which assumptions move it most.</span>
          </li>
        </ol>
        <HeroIllustration />
      </div>
    </section>
  );
}

/** Decorative: five bars of future cash, each shrinking as it is discounted. */
function HeroIllustration() {
  const bars = [0.55, 0.62, 0.69, 0.77, 0.85];
  return (
    <svg className="hero-art" viewBox="0 0 260 96" aria-hidden="true" focusable="false">
      {bars.map((h, i) => {
        const x = 8 + i * 50;
        const full = h * 80;
        const today = full / Math.pow(1.09, i + 1);
        return (
          <g key={i} style={{ animationDelay: `${i * 70}ms` }} className="hero-bar">
            <rect x={x} y={88 - full} width="34" height={full} className="hero-bar-ghost" rx="2" />
            <rect x={x} y={88 - today} width="34" height={today} className="hero-bar-fill" rx="2" />
          </g>
        );
      })}
      <line x1="0" x2="260" y1="88.5" y2="88.5" className="hero-axis" />
    </svg>
  );
}
