import { useMemo } from 'react';
import {
  formatBig,
  formatPerShare,
  formatRate,
  formatShareCount,
  sensitivityGrid,
  type Assumptions,
  type DcfResult,
  type Financials,
} from '../lib/dcf';
import { Term } from './Term';

interface UnderTheHoodProps {
  financials: Financials;
  assumptions: Assumptions;
  result: DcfResult;
}

export function UnderTheHood({ financials, assumptions, result }: UnderTheHoodProps) {
  const grid = useMemo(
    () => sensitivityGrid(financials, assumptions),
    [financials, assumptions],
  );

  return (
    <details className="hood">
      <summary>Under the hood — every number we used</summary>

      <div className="hood-body">
        <div className="table-scroll">
          <table>
            <caption>
              Year by year
              <span className="caption-note">
                What we project the company brings in, and what that is worth today.
              </span>
            </caption>
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Free cash flow</th>
                <th scope="col">Discount factor</th>
                <th scope="col">Worth today</th>
              </tr>
            </thead>
            <tbody>
              {result.years.map((year) => (
                <tr key={year.year}>
                  <th scope="row">Year {year.year}</th>
                  <td className="num">{formatBig(year.fcf)}</td>
                  <td className="num">{year.discountFactor.toFixed(3)}</td>
                  <td className="num">{formatBig(year.presentValue)}</td>
                </tr>
              ))}
              <tr className="terminal-row">
                <th scope="row">After year 5</th>
                <td className="num">{formatBig(result.terminal.value)}</td>
                <td className="num">{result.terminal.discountFactor.toFixed(3)}</td>
                <td className="num">{formatBig(result.terminal.presentValue)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <Term id="enterprise-value">Value of the business</Term>
                </td>
                <td colSpan={2} />
                <td className="num">{formatBig(result.enterpriseValue)}</td>
              </tr>
            </tfoot>
          </table>

          <table style={{ marginTop: 28 }}>
            <caption>
              From the business to one share
              <span className="caption-note">
                Cash in the bank counts for you; debt gets paid before you do.
              </span>
            </caption>
            <tbody>
              <tr>
                <th scope="row">
                  <Term id="enterprise-value">Value of the business</Term>
                </th>
                <td className="num">{formatBig(result.enterpriseValue)}</td>
              </tr>
              <tr>
                <th scope="row">Plus cash on hand</th>
                <td className="num">{formatBig(financials.cash)}</td>
              </tr>
              <tr>
                <th scope="row">
                  Less <Term id="total-debt" />
                </th>
                <td className="num">-{formatBig(financials.debt)}</td>
              </tr>
              <tr>
                <th scope="row">
                  <Term id="equity-value">Value belonging to shareholders</Term>
                </th>
                <td className="num">{formatBig(result.equityValue)}</td>
              </tr>
              <tr>
                <th scope="row">
                  Divided by <Term id="shares-outstanding" />
                </th>
                <td className="num">{formatShareCount(financials.sharesOutstanding)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Fair value per share</td>
                <td className="num">{formatPerShare(result.fairValuePerShare)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="table-scroll">
          <table className="sens">
            <caption>
              If we were wrong
              <span className="caption-note">
                Fair value per share at nearby assumptions. Your current setting is highlighted.
              </span>
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">Discount rate</span>
                </th>
                {grid[0].map((cell) => (
                  <th scope="col" key={cell.growthRate} className="num">
                    {formatRate(cell.growthRate)} growth
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row) => (
                <tr key={row[0].discountRate}>
                  <th scope="row" className="num">
                    {formatRate(row[0].discountRate)} return
                  </th>
                  {row.map((cell) => (
                    <td
                      key={`${cell.growthRate}-${cell.discountRate}`}
                      className={`num${cell.selected ? ' selected' : ''}`}
                      aria-current={cell.selected ? 'true' : undefined}
                    >
                      {formatPerShare(cell.fairValuePerShare)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="slider-hint" style={{ marginTop: 16 }}>
            Small changes in these two assumptions move the answer a lot. That is not a flaw in the
            method — it is the honest reason two careful analysts can look at the same company and
            reach different numbers.
          </p>
        </div>
      </div>
    </details>
  );
}
