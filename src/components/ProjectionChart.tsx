import { formatBig, formatRate, type DcfResult } from '../lib/dcf';
import { Explain } from './Explain';

interface ProjectionChartProps {
  fcf0: number;
  result: DcfResult;
  growthRate: number;
  /** Fiscal-year label for the reported starting point, e.g. "FY2025". */
  baseLabel: string;
}

/**
 * Stage 3: the reported starting year, then five projected years. Plain HTML
 * bars, so labels stay readable at any width and heights animate with CSS.
 */
export function ProjectionChart({ fcf0, result, growthRate, baseLabel }: ProjectionChartProps) {
  const columns = [
    { key: 'y0', label: baseLabel === 'Last year' ? 'Year 0' : baseLabel, sub: 'Reported', value: fcf0, reported: true },
    ...result.years.map((y) => ({
      key: `y${y.year}`,
      label: `Year ${y.year}`,
      sub: 'Projected',
      value: y.fcf,
      reported: false,
    })),
  ];
  const max = Math.max(...columns.map((c) => c.value), 1);
  const total = result.years.reduce((sum, y) => sum + y.fcf, 0);
  const finalYear = result.years[result.years.length - 1].fcf;

  const summary = `Free cash flow starts at ${formatBig(fcf0)} reported, and at ${formatRate(
    growthRate,
  )} growth a year reaches ${formatBig(finalYear)} in year 5. ${columns
    .slice(1)
    .map((c) => `${c.label}: ${formatBig(c.value)}`)
    .join('; ')}.`;

  return (
    <figure className="card projection">
      <div className="chart-legend" aria-hidden="true">
        <span>
          <i className="legend-swatch reported" /> Reported
        </span>
        <span>
          <i className="legend-swatch projected" /> Projected from your growth assumption
        </span>
      </div>

      <div className="projection-bars" role="img" aria-label={summary}>
        {columns.map((c) => (
          <div className={`projection-col${c.reported ? ' reported' : ''}`} key={c.key}>
            <span className="projection-value num">{formatBig(c.value)}</span>
            <span className="projection-track">
              <span className="projection-bar" style={{ height: `${(c.value / max) * 100}%` }} />
            </span>
            <span className="projection-label">{c.label}</span>
            <span className="projection-sub">{c.sub}</span>
          </div>
        ))}
      </div>

      <dl className="projection-facts">
        <div>
          <dt>Growth you chose</dt>
          <dd className="num assumption-text">{formatRate(growthRate)} a year</dd>
        </div>
        <div>
          <dt>Year 5 free cash flow</dt>
          <dd className="num">{formatBig(finalYear)}</dd>
        </div>
        <div>
          <dt>Total over five years</dt>
          <dd className="num">{formatBig(total)}</dd>
        </div>
      </dl>

      <Explain>
        Each year is last year’s cash times one plus your growth rate. Small differences compound:
        at {formatRate(growthRate)} a year, cash ends year 5 at{' '}
        {fcf0 > 0 ? `${(finalYear / fcf0).toFixed(2)}×` : '—'} where it started. These are
        projections — they only exist because of your assumption.
      </Explain>
    </figure>
  );
}
