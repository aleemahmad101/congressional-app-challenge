import { companyCount } from '../data/companies';

/**
 * The first five seconds: what this is, why it matters, what to do, and
 * what you will learn.
 */
interface HeroProps {
  /** Opens the suggested first company. */
  onTry: () => void;
}

export function Hero({ onTry }: HeroProps) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow">Financial literacy, one company at a time</p>
        <h1 id="hero-title" className="hero-title">
          What is a company <em>actually</em> worth?
        </h1>
        <p className="hero-sub">
          Pick a company. Change its future. See how its value changes — and understand why.
        </p>
        <div className="hero-actions">
          <a
            className="btn btn-lg"
            href="?company=aapl"
            onClick={(event) => {
              event.preventDefault();
              onTry();
            }}
          >
            Try Apple in 60 seconds
            <span aria-hidden="true"> →</span>
          </a>
          <a className="btn btn-lg ghost" href="#companies">
            Explore companies
          </a>
        </div>
        <p className="hero-meta">
          {companyCount()} · free · no account · nothing to install
        </p>
        <p className="hero-story">
          I built this after helping my mother and grandmother learn to invest.{' '}
          <a href="#why-i-built-this">Why I built it</a>
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
