import { formatBig, formatPerShare, formatPercent, formatShareCount } from '../lib/dcf';
import { formatDate, type Company } from '../data/companies';
import type { Figure, HistoryPoint } from '../data/types';
import type { TermKey } from '../data/glossary';
import { Explain } from './Explain';
import { SourceTag } from './SourceTag';
import { Term } from './Term';

interface FigureCardProps {
  label: React.ReactNode;
  value: string;
  figure?: Figure;
  calculated?: boolean;
  sub?: React.ReactNode;
  emphasis?: boolean;
}

function FigureCard({ label, value, figure, calculated, sub, emphasis }: FigureCardProps) {
  return (
    <div className={`figure-card${emphasis ? ' emphasis' : ''}`}>
      <dt>{label}</dt>
      <dd>
        <span className="figure-value num">{value}</span>
        {sub && <span className="figure-sub">{sub}</span>}
        <SourceTag figure={figure} calculated={calculated} />
      </dd>
    </div>
  );
}

const term = (id: TermKey, text?: string) => <Term id={id}>{text}</Term>;

interface BusinessTodayProps {
  company: Company;
}

/** Stage 1: the reported facts, before any assumption touches them. */
export function BusinessToday({ company }: BusinessTodayProps) {
  const r = company.reported;
  const margin =
    r.revenue && r.operatingIncome && r.revenue.value > 0
      ? r.operatingIncome.value / r.revenue.value
      : null;
  const fcfMargin =
    r.revenue && r.freeCashFlow && r.revenue.value > 0 ? r.freeCashFlow.value / r.revenue.value : null;
  const marketValue = r.price && r.shares ? r.price.value * r.shares.value : null;

  return (
    <div className="business-today">
      <div className="card company-intro">
        <p className="what">{company.whatTheyDo}</p>
        <p className="period">
          {company.periodEnd
            ? `Latest fiscal year ended ${formatDate(company.periodEnd)}`
            : company.usesSample
              ? 'Sample figures — not yet checked against a filing'
              : company.hand
                ? `Figures for ${company.hand.fiscalYear}`
                : 'Reported figures'}
        </p>
      </div>

      <Explain>
        Everything on this step is <strong>reported</strong> — taken from the company’s own annual
        report, with a link to the source. Nothing here is a guess. Your guesses come next.
      </Explain>

      <div className="figure-groups">
        <section aria-labelledby="earns-title">
          <h3 className="group-title" id="earns-title">
            What the business earns
          </h3>
          <dl className="figure-grid">
            {r.revenue && (
              <FigureCard
                label={term('revenue', 'Revenue')}
                value={formatBig(r.revenue.value)}
                figure={r.revenue}
              />
            )}
            {r.operatingIncome && (
              <FigureCard
                label="Operating income"
                value={formatBig(r.operatingIncome.value)}
                figure={r.operatingIncome}
              />
            )}
            {margin !== null && (
              <FigureCard
                label={term('operating-margin', 'Operating margin')}
                value={formatPercent(margin, 1)}
                calculated
                sub={`${Math.round(margin * 100)}¢ of operating profit per $1 of sales`}
              />
            )}
            {r.freeCashFlow && (
              <FigureCard
                label={term('free-cash-flow', 'Free cash flow')}
                value={formatBig(r.freeCashFlow.value)}
                figure={r.freeCashFlow}
                emphasis
                sub={
                  fcfMargin !== null
                    ? `${Math.round(fcfMargin * 100)}¢ of free cash per $1 of sales`
                    : 'The starting point for the forecast'
                }
              />
            )}
          </dl>
        </section>

        {r.operatingCashFlow && r.capex && r.freeCashFlow && (
          <CashBridge ocf={r.operatingCashFlow.value} capex={r.capex.value} fcf={r.freeCashFlow.value} />
        )}

        <section aria-labelledby="owns-title">
          <h3 className="group-title" id="owns-title">
            What it owns, owes, and how it is divided
          </h3>
          <dl className="figure-grid">
            {r.cash && (
              <FigureCard label="Cash & short-term investments" value={formatBig(r.cash.value)} figure={r.cash} />
            )}
            {r.debt && (
              <FigureCard label={term('total-debt', 'Total debt')} value={formatBig(r.debt.value)} figure={r.debt} />
            )}
            {r.shares && (
              <FigureCard
                label={term('shares-outstanding', 'Shares outstanding')}
                value={formatShareCount(r.shares.value)}
                figure={r.shares}
              />
            )}
            {r.price && (
              <FigureCard
                label={term('reference-price', 'Reference share price')}
                value={formatPerShare(r.price.value)}
                figure={r.price}
                sub={
                  r.price.provenance.kind === 'manual'
                    ? `as of ${formatDate(r.price.provenance.asOf)}`
                    : undefined
                }
              />
            )}
            {marketValue !== null && (
              <FigureCard
                label={term('market-cap', 'Market value')}
                value={formatBig(marketValue)}
                calculated
                sub="share price × shares"
              />
            )}
          </dl>
        </section>
      </div>

      {company.history.filter((h) => h.freeCashFlow !== undefined).length >= 2 && (
        <FcfHistory history={company.history} />
      )}

      {company.dataNotes.length > 0 && (
        <details className="data-notes">
          <summary>Notes on these figures</summary>
          <ul>
            {company.dataNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/* --------------------------------------------------------- cash bridge --- */

function CashBridge({ ocf, capex, fcf }: { ocf: number; capex: number; fcf: number }) {
  const max = Math.max(ocf, capex, Math.abs(fcf), 1);
  const width = (v: number) => `${Math.max(1.5, (Math.abs(v) / max) * 100)}%`;
  return (
    <figure className="bridge card">
      <figcaption>
        <span className="group-title">Where free cash flow comes from</span>
        <Explain as="div" className="bridge-explain">
          <Term id="operating-cash-flow">Cash from operations</Term> minus{' '}
          <Term id="capex">capital expenditures</Term> = free cash flow — the cash left after keeping
          the business running and equipped.
        </Explain>
      </figcaption>
      <dl className="bridge-rows">
        <div>
          <dt>Cash from operations</dt>
          <dd>
            <span className="bridge-bar plus" style={{ width: width(ocf) }} />
            <span className="num">{formatBig(ocf)}</span>
          </dd>
        </div>
        <div>
          <dt>Minus equipment &amp; buildings</dt>
          <dd>
            <span className="bridge-bar minus" style={{ width: width(capex) }} />
            <span className="num">−{formatBig(capex)}</span>
          </dd>
        </div>
        <div className="total">
          <dt>= Free cash flow</dt>
          <dd>
            <span className={`bridge-bar ${fcf >= 0 ? 'result' : 'minus'}`} style={{ width: width(fcf) }} />
            <span className="num">{formatBig(fcf)}</span>
          </dd>
        </div>
      </dl>
    </figure>
  );
}

/* ------------------------------------------------------------- history --- */

function FcfHistory({ history }: { history: HistoryPoint[] }) {
  const points = history.filter((h) => h.freeCashFlow !== undefined);
  const max = Math.max(...points.map((p) => Math.abs(p.freeCashFlow as number)), 1);
  const hasNegative = points.some((p) => (p.freeCashFlow as number) < 0);
  const summary = points
    .map((p) => `fiscal ${p.periodEnd.slice(0, 4)}: ${formatBig(p.freeCashFlow as number)}`)
    .join('; ');

  return (
    <figure className="history card">
      <figcaption>
        <span className="group-title">Free cash flow, past {points.length} years</span>
        <span className="source-tag reported">Reported</span>
      </figcaption>
      <div
        className={`history-bars${hasNegative ? ' with-negative' : ''}`}
        role="img"
        aria-label={`Reported free cash flow by fiscal year — ${summary}.`}
      >
        {points.map((p) => {
          const v = p.freeCashFlow as number;
          return (
            <div className="history-col" key={p.periodEnd}>
              <span className="history-value num">{formatBig(v)}</span>
              <span className="history-track">
                <span
                  className={`history-bar${v < 0 ? ' negative' : ''}`}
                  style={{ height: `${(Math.abs(v) / max) * 100}%` }}
                />
              </span>
              <span className="history-year num">FY{p.periodEnd.slice(0, 4)}</span>
            </div>
          );
        })}
      </div>
      <Explain>
        Look for the trend, not one year. Steady growth makes a forecast easier to believe; big
        swings mean any single assumption is a rougher guess.
      </Explain>
    </figure>
  );
}
