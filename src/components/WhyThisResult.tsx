import { useMemo } from 'react';
import {
  formatPerShare,
  formatPercent,
  formatRate,
  impliedGrowth,
  sensitivityGrid,
  type Assumptions,
  type DcfResult,
  type Financials,
} from '../lib/dcf';
import {
  ASSUMPTION_NAMES,
  assumptionDrivers,
  describeDriver,
  elasticities,
  valueBridge,
} from '../lib/insights';
import { Explain } from './Explain';
import type { PriceComparison } from '../data/companies';
import { Term } from './Term';

interface WhyThisResultProps {
  financials: Financials;
  assumptions: Assumptions;
  start: Assumptions;
  result: DcfResult;
  /** Wording for price comparisons; null hides them. */
  price: PriceComparison | null;
  onApply: (patch: Partial<Assumptions>) => void;
}

/** Stage 6: which assumptions mattered, and the range of reasonable answers. */
export function WhyThisResult({ financials, assumptions, start, result, price, onApply }: WhyThisResultProps) {
  const drivers = useMemo(
    () => assumptionDrivers(financials, start, assumptions),
    [financials, start, assumptions],
  );
  const nudges = useMemo(() => elasticities(financials, assumptions), [financials, assumptions]);
  const bridge = useMemo(() => valueBridge(financials, result), [financials, result]);
  const implied = useMemo(() => impliedGrowth(financials, assumptions), [financials, assumptions]);

  const biggest = Math.max(...drivers.map((d) => Math.abs(d.effect)), ...nudges.map((n) => Math.abs(n.perShare)), 1e-9);
  const netDebtPerShare = (financials.debt - financials.cash) / financials.sharesOutstanding;

  return (
    <div className="why">
      <div className="why-grid">
        <section className="card why-drivers" aria-labelledby="drivers-title">
          <h3 className="group-title" id="drivers-title">
            {drivers.length > 0 ? 'What your changes did' : 'What moves this estimate most'}
          </h3>

          {drivers.length > 0 ? (
            <ul className="driver-list">
              {drivers.map((d) => (
                <li key={d.key}>
                  <p>{describeDriver(d)}</p>
                  <EffectBar value={d.effect} max={biggest} />
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="why-intro">
                You are still on the starting assumptions. Here is how much one small nudge to each
                would move the estimate:
              </p>
              <ul className="driver-list">
                {nudges.map((n) => (
                  <li key={n.key}>
                    <p>
                      {ASSUMPTION_NAMES[n.key]} up {formatRate(n.step)} →{' '}
                      <strong className="num">
                        {n.perShare >= 0 ? '+' : '−'}
                        {formatPerShare(Math.abs(n.perShare))}
                      </strong>{' '}
                      a share
                    </p>
                    <EffectBar value={n.perShare} max={biggest} />
                  </li>
                ))}
              </ul>
            </>
          )}

          <ul className="insight-list">
            <li>
              <strong>{Math.round(bridge.beyondShare * 100)}%</strong> of the business’s value comes
              from cash expected <em>after</em> year 5 — so long-term assumptions carry most of the
              weight.
            </li>
            {netDebtPerShare > 0.005 && (
              <li>
                Debt beyond its cash takes <strong className="num">{formatPerShare(netDebtPerShare)}</strong>{' '}
                off every share before shareholders get anything.
              </li>
            )}
            {netDebtPerShare < -0.005 && (
              <li>
                Cash beyond its debt adds <strong className="num">{formatPerShare(-netDebtPerShare)}</strong>{' '}
                to every share.
              </li>
            )}
          </ul>

          {implied !== null && price && (
            <p className="implied">
              <span className="eyebrow">What the price assumed</span>
              At {price.phrase} ({formatPerShare(financials.currentPrice as number)}), the price
              implied cash growing about{' '}
              <strong className="num">{formatPercent(implied, 1)}</strong> a year for five years
              (with your discount rate). You assumed{' '}
              <strong className="num">{formatRate(assumptions.growthRate)}</strong>. The gap is how
              much you disagree with the market.
            </p>
          )}
        </section>

        <Sensitivity financials={financials} assumptions={assumptions} price={price} onApply={onApply} />
      </div>
    </div>
  );
}

function EffectBar({ value, max }: { value: number; max: number }) {
  const width = Math.min(50, (Math.abs(value) / max) * 50);
  return (
    <span className="effect-track" aria-hidden="true">
      <span
        className={`effect-bar ${value >= 0 ? 'up' : 'down'}`}
        style={value >= 0 ? { left: '50%', width: `${width}%` } : { right: '50%', width: `${width}%` }}
      />
    </span>
  );
}

/* --------------------------------------------------------- sensitivity --- */

function Sensitivity({
  financials,
  assumptions,
  price: comparison,
  onApply,
}: {
  financials: Financials;
  assumptions: Assumptions;
  price: PriceComparison | null;
  onApply: (patch: Partial<Assumptions>) => void;
}) {
  const grid = useMemo(() => sensitivityGrid(financials, assumptions), [financials, assumptions]);
  const values = grid.flat().map((c) => c.fairValuePerShare);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const base = grid.flat().find((c) => c.selected)?.fairValuePerShare ?? values[4];
  const price = financials.currentPrice;

  // Shade by distance from your estimate: greener above, warmer below.
  const spread = Math.max(Math.abs(high - base), Math.abs(base - low), 1e-9);
  const tone = (v: number) => {
    const t = (v - base) / spread;
    return { '--t': Math.abs(t).toFixed(3) } as React.CSSProperties;
  };

  return (
    <section className="card sensitivity" aria-labelledby="sens-title">
      <h3 className="group-title" id="sens-title">
        Value is a range: nine nearby scenarios
      </h3>
      <Explain>
        A <Term id="sensitivity">sensitivity table</Term>. Each cell re-runs the whole model with
        growth a little higher or lower (across) and the discount rate a little higher or lower
        (down). Tap a cell to try it.
      </Explain>

      <div className="table-scroll">
        <table className="sens">
          <caption className="visually-hidden">
            Estimated value per share by growth rate (columns) and discount rate (rows). Your current
            setting is marked.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="sens-corner">
                <span>Discount ↓</span>
                <span>Growth →</span>
              </th>
              {grid[0].map((cell) => (
                <th scope="col" key={cell.growthRate} className="num">
                  {formatRate(cell.growthRate)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row[0].discountRate}>
                <th scope="row" className="num">
                  {formatRate(row[0].discountRate)}
                </th>
                {row.map((cell) => {
                  const above = cell.fairValuePerShare >= base;
                  return (
                    <td
                      key={`${cell.growthRate}-${cell.discountRate}`}
                      className={`${above ? 'above' : 'below'}${cell.selected ? ' selected' : ''}`}
                      style={tone(cell.fairValuePerShare)}
                    >
                      <button
                        type="button"
                        className="sens-cell num"
                        aria-current={cell.selected ? 'true' : undefined}
                        aria-label={`${formatPerShare(cell.fairValuePerShare)} at ${formatRate(
                          cell.growthRate,
                        )} growth and ${formatRate(cell.discountRate)} discount rate${
                          cell.selected ? ' (your current setting)' : '. Apply these assumptions'
                        }`}
                        onClick={() =>
                          onApply({ growthRate: cell.growthRate, discountRate: cell.discountRate })
                        }
                      >
                        {formatPerShare(cell.fairValuePerShare)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="sens-range">
        Across these scenarios the estimate runs from{' '}
        <strong className="num">{formatPerShare(low)}</strong> to{' '}
        <strong className="num">{formatPerShare(high)}</strong> a share
        {price !== null && comparison && (
          <>
            {' '}
            — {comparison.phrase}, <span className="num">{formatPerShare(price)}</span>,{' '}
            {price >= low && price <= high ? 'falls inside that range' : price > high ? 'sits above all of them' : 'sits below all of them'}
          </>
        )}
        .
      </p>
      <p className="sens-note">
        Small changes move the answer a lot. That is not a flaw in the method — it is why two careful
        people can study the same company and reach different values.
      </p>
    </section>
  );
}
