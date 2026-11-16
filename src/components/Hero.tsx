import { useId, useState } from 'react';
import {
  DISCOUNT_RANGE,
  GROWTH_RANGE,
  PROJECTION_YEARS,
  formatDelta,
  formatPerShare,
  formatRate,
  runDcf,
  type Assumptions,
} from '../lib/dcf';
import { buildSearch } from '../lib/url';
import { openingAssumptions } from '../lib/spotlight';
import {
  COMPANIES,
  POPULAR_COMPANIES,
  formatPriceDate,
  monogram,
  referencePriceDate,
  type Company,
} from '../data/companies';
import { useCountUp } from '../hooks';

interface HeroProps {
  /** Opens a company's full six-step valuation with these assumptions. */
  onOpen: (company: Company, assumptions: Assumptions) => void;
}

/** The company the playground opens on: its estimate sits close to its price, so the comparison reads clearly. */
const FIRST = 'dis';

/**
 * The first screen: a promise in one sentence, and a real valuation to play
 * with before reading anything else.
 */
export function Hero({ onOpen }: HeroProps) {
  const playable = POPULAR_COMPANIES.filter((c) => c.financials);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title" className="hero-title">
          What is a company <em>actually</em> worth?
        </h1>
        <p className="hero-sub">
          A stock’s price is what people pay for it. Its value is what the business can earn.
          ClearValue lets you work out the second from a company’s own SEC filings, and see
          exactly how your guesses change it.
        </p>
        <div className="hero-actions">
          <a className="btn btn-lg" href="#companies">
            Pick a company
            <span aria-hidden="true"> →</span>
          </a>
          <a className="hero-link" href="#how-it-works">
            How the math works
          </a>
        </div>
        <ul className="hero-facts">
          <li>
            <strong className="num">{COMPANIES.length}</strong> real companies
          </li>
          <li>
            Figures from <strong>SEC filings</strong>
          </li>
          <li>
            <strong>Free</strong>, no sign-up
          </li>
        </ul>
        <p className="hero-story">
          I built this after helping my mother and grandmother learn to invest.{' '}
          <a href="#why-i-built-this">Why I built it</a>
        </p>
      </div>

      {playable.length > 0 && <Playground companies={playable} onOpen={onOpen} />}
    </section>
  );
}

/* ---------------------------------------------------------- playground --- */

interface PlaygroundProps {
  companies: Company[];
  onOpen: (company: Company, assumptions: Assumptions) => void;
}

/**
 * A real discounted cash flow, small enough to take in at a glance: the same
 * model and the same reported figures as the full valuation, two of its three
 * assumptions, and a link that carries both into the six steps.
 */
function Playground({ companies, onOpen }: PlaygroundProps) {
  const id = useId();
  const [companyId, setCompanyId] = useState(
    companies.some((c) => c.id === FIRST) ? FIRST : companies[0].id,
  );
  const company = companies.find((c) => c.id === companyId) ?? companies[0];
  const financials = company.financials!;
  const [overrides, setOverrides] = useState<Partial<Assumptions>>({});
  const assumptions = { ...openingAssumptions(company), ...overrides };

  const result = runDcf(financials, assumptions);
  const shown = useCountUp(result.fairValuePerShare, 260);
  const priceIso = referencePriceDate(company);
  const price = financials.currentPrice;
  const afterFive = result.enterpriseValue > 0 ? result.terminal.presentValue / result.enterpriseValue : null;

  // One scale per company, with headroom above its starting growth, so the bars
  // fill the chart at first and visibly grow and shrink as the assumptions move.
  const headroom = Math.min(GROWTH_RANGE.max, openingAssumptions(company).growthRate + 0.03);
  const scale = financials.fcf0 * Math.pow(1 + headroom, PROJECTION_YEARS);

  const choose = (next: Company) => {
    setCompanyId(next.id);
    setOverrides({});
  };

  const href = buildSearch({ company: company.id, assumptions });

  return (
    <div className="playground card" role="group" aria-labelledby={`${id}-title`}>
      <div className="pg-head">
        <p className="pg-title" id={`${id}-title`}>
          Try it on a real company
        </p>
        <div className="pg-tabs" role="radiogroup" aria-label="Company">
          {companies.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={c.id === company.id}
              className={`pg-tab${c.id === company.id ? ' on' : ''}`}
              onClick={() => choose(c)}
              title={c.name}
            >
              {c.ticker}
            </button>
          ))}
        </div>
      </div>

      <div className="pg-readout">
        <span className={`monogram group-${company.group.toLowerCase()}`} aria-hidden="true">
          {monogram(company)}
        </span>
        <div className="pg-figure">
          <p className="pg-label">{company.name}, estimated value per share</p>
          <p className={`pg-value num${result.fairValuePerShare < 0 ? ' negative' : ''}`} aria-live="polite">
            {formatPerShare(shown)}
          </p>
          {price !== null && result.upside !== null && priceIso && (
            <p className="pg-compare">
              Closing price {formatPriceDate(priceIso)}:{' '}
              <span className="num">{formatPerShare(price)}</span>
              <span className={`delta-pill${result.upside < 0 ? ' down' : ''}`}>
                {formatDelta(result.upside)}
                <span className="pill-word">{result.upside < 0 ? 'below' : 'above'}</span>
              </span>
            </p>
          )}
        </div>
      </div>

      <figure className="pg-chart">
        <div className="pg-bars" aria-hidden="true">
          {result.years.map((y) => (
            <div className="pg-col" key={y.year}>
              <div className="pg-track">
                <span className="pg-ghost" style={{ height: `${Math.min(100, (y.fcf / scale) * 100)}%` }} />
                <span className="pg-fill" style={{ height: `${Math.min(100, (y.presentValue / scale) * 100)}%` }} />
              </div>
              <span className="pg-year">Year {y.year}</span>
            </div>
          ))}
        </div>
        <figcaption>
          <span className="pg-key">
            <span className="pg-key-ghost" aria-hidden="true" /> cash that year
          </span>
          <span className="pg-key">
            <span className="pg-key-fill" aria-hidden="true" /> what it is worth today
          </span>
          {afterFive !== null && (
            <span className="pg-note">
              <strong className="num">{Math.round(afterFive * 100)}%</strong> of the business’s value comes from
              cash after year five.
            </span>
          )}
        </figcaption>
      </figure>

      <div className="pg-controls">
        <RateSlider
          label="Growth, years 1–5"
          value={assumptions.growthRate}
          min={GROWTH_RANGE.min}
          max={GROWTH_RANGE.max}
          step={GROWTH_RANGE.step}
          onChange={(growthRate) => setOverrides((o) => ({ ...o, growthRate }))}
        />
        <RateSlider
          label="Return you require"
          value={assumptions.discountRate}
          min={DISCOUNT_RANGE.min}
          max={DISCOUNT_RANGE.max}
          step={DISCOUNT_RANGE.step}
          onChange={(discountRate) => setOverrides((o) => ({ ...o, discountRate }))}
        />
      </div>

      <div className="pg-foot">
        <p className="pg-source">
          Free cash flow {company.periodEnd ? `for the year ending ${formatPriceDate(company.periodEnd)}` : ''}, from{' '}
          {company.name}’s 10-K.
        </p>
        <a
          className="btn"
          href={href}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
            event.preventDefault();
            onOpen(company, assumptions);
          }}
        >
          See all six steps
          <span aria-hidden="true"> →</span>
        </a>
      </div>
    </div>
  );
}

interface RateSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function RateSlider({ label, value, min, max, step, onChange }: RateSliderProps) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="pg-slider">
      <div className="pg-slider-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="num">
          {formatRate(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${fill}%` } as React.CSSProperties}
        aria-valuetext={`${formatRate(value)} a year`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
