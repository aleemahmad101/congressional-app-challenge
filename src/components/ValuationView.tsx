import { useMemo } from 'react';
import {
  formatBig,
  formatPerShare,
  formatShareCount,
  runDcf,
  type Assumptions,
  type Financials,
} from '../lib/dcf';
import { assumptionsAreStrict } from '../lib/spotlight';
import { useActiveSection } from '../hooks';
import {
  dataVintage,
  priceComparison,
  historicalGrowth,
  monogram,
  type Company,
} from '../data/companies';
import { AssumptionPanel } from './AssumptionPanel';
import { BusinessToday } from './BusinessToday';
import { Explain } from './Explain';
import { ProjectionChart } from './ProjectionChart';
import { ResultPanel } from './ResultPanel';
import { RiverOfCash } from './RiverOfCash';
import { Stage } from './Stage';
import { StageNav, type StageInfo } from './StageNav';
import { StrictAssumptionsNote } from './StrictAssumptionsNote';
import { Term } from './Term';
import { UnderTheHood } from './UnderTheHood';
import { WhyThisResult } from './WhyThisResult';

const STAGES: (StageInfo & { title: string })[] = [
  { id: 'stage-today', short: 'Today', title: 'The business today' },
  { id: 'stage-assumptions', short: 'Assumptions', title: 'Your assumptions' },
  { id: 'stage-projection', short: 'Projection', title: 'The five-year projection' },
  { id: 'stage-discount', short: 'Back to today', title: 'Bring future cash back to today' },
  { id: 'stage-estimate', short: 'Estimate', title: 'Your estimated value' },
  { id: 'stage-why', short: 'Why', title: 'What changed the result?' },
];
const STAGE_IDS = STAGES.map((s) => s.id);

/** Either a catalog company or figures the visitor typed in. */
export type ValuationSubject =
  | { kind: 'company'; company: Company }
  | { kind: 'manual'; name: string; ticker?: string; financials: Financials };

interface ValuationViewProps {
  subject: ValuationSubject;
  financials: Financials;
  assumptions: Assumptions;
  start: Assumptions;
  learnMode: boolean;
  onChange: (next: Assumptions) => void;
  onReset: () => void;
  onBack: () => void;
  onEditManual: () => void;
}

export function ValuationView({
  subject,
  financials,
  assumptions,
  start,
  learnMode,
  onChange,
  onReset,
  onBack,
  onEditManual,
}: ValuationViewProps) {
  const result = useMemo(() => runDcf(financials, assumptions), [financials, assumptions]);
  const strict = useMemo(() => assumptionsAreStrict(assumptions), [assumptions]);
  const active = useActiveSection(STAGE_IDS);

  const company = subject.kind === 'company' ? subject.company : null;
  const name = company ? company.name : subject.kind === 'manual' ? subject.name : '';
  const ticker = company?.ticker ?? (subject.kind === 'manual' ? subject.ticker : undefined);

  const fcfTrend = useMemo(() => (company ? historicalGrowth(company.history, 'freeCashFlow') : null), [company]);
  const revenueTrend = useMemo(() => (company ? historicalGrowth(company.history, 'revenue') : null), [company]);

  // Wording and date for every comparison with a market price. Null hides
  // the comparison everywhere: no verified price, no comparison.
  const price = priceComparison(company, financials.currentPrice !== null);
  const baseLabel = company?.periodEnd
    ? `FY${company.periodEnd.slice(0, 4)}`
    : company?.hand && /^FY\d{4}$/.test(company.hand.fiscalYear)
      ? company.hand.fiscalYear
      : 'Last year';

  const stage = (i: number) => ({ id: STAGES[i].id, number: i + 1, title: STAGES[i].title, done: i < active });

  return (
    <div className="valuation">
      <div className="company-banner">
        <button type="button" className="back-link" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M13 8H3.5M7.5 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All companies
        </button>
        <div className="banner-id">
          <span
            className={`monogram lg${company ? ` group-${company.group.toLowerCase()}` : ''}`}
            aria-hidden="true"
          >
            {ticker ? monogram({ ticker }) : 'YOU'}
          </span>
          <div>
            <h1 className="banner-name">Valuing {name}</h1>
            <p className="banner-meta">
              {ticker && <span className="ticker num">{ticker}</span>}
              {company ? (
                <>
                  {' '}
                  · {company.group} · {company.industry}
                </>
              ) : (
                ' Figures you entered'
              )}
            </p>
          </div>
        </div>
      </div>

      <StageNav
        stages={STAGES}
        active={active}
        estimate={result.fairValuePerShare}
        upside={price ? result.upside : null}
        priceDate={price?.date ?? null}
      />

      <Stage
        {...stage(0)}
        intro={
          <>
            The facts we start from: what {name} reported in its latest annual report. Of all this,
            the model needs one number most — <Term id="free-cash-flow" />.
          </>
        }
      >
        {company ? (
          <BusinessToday company={company} />
        ) : (
          <ManualFigures financials={financials} onEdit={onEditManual} />
        )}
      </Stage>

      <Stage
        {...stage(1)}
        intro="Three guesses about the future. These are yours to make — no one knows the right answer."
      >
        {strict && <StrictAssumptionsNote />}
        <AssumptionPanel
          assumptions={assumptions}
          start={start}
          onChange={onChange}
          onReset={onReset}
          result={result}
          fcfTrend={fcfTrend}
          revenueTrend={revenueTrend}
          startingGrowth={company?.startingGrowth ?? null}
        />
      </Stage>

      <Stage
        {...stage(2)}
        intro="Your growth assumption, applied year by year to last year’s free cash flow."
      >
        <ProjectionChart
          fcf0={financials.fcf0}
          result={result}
          growthRate={assumptions.growthRate}
          baseLabel={baseLabel}
          baseSource={company ? 'calculated from reported data' : 'your figures'}
        />
      </Stage>

      <Stage
        {...stage(3)}
        intro={
          <>
            A dollar in five years is worth less than a dollar today. The outlines are the cash as it
            arrives; the solid bars are what it is worth now, at your{' '}
            <Term id="discount-rate" />.
          </>
        }
      >
        <RiverOfCash result={result} discountRate={assumptions.discountRate} learnMode={learnMode} />
        <Explain>
          Notice the last bar. Cash after year 5 is rolled into a single{' '}
          <Term id="terminal-value" />, and it is usually the biggest piece of the answer.
        </Explain>
      </Stage>

      <Stage {...stage(4)} intro="Add up every discounted dollar, settle cash and debt, and divide by the shares.">
        <ResultPanel
          name={name}
          result={result}
          financials={financials}
          assumptions={assumptions}
          price={price}
          vintage={company ? dataVintage(company) : null}
          isSample={company?.usesSample ?? false}
        />
      </Stage>

      <Stage
        {...stage(5)}
        intro="Valuation is an argument about the future. Here is which parts of your argument mattered."
      >
        <WhyThisResult
          financials={financials}
          assumptions={assumptions}
          start={start}
          result={result}
          price={price}
          onApply={(patch) => onChange({ ...assumptions, ...patch })}
        />
        <UnderTheHood financials={financials} result={result} />

        <div className="next-steps">
          <p>Want to compare? The same assumptions can tell very different stories for different businesses.</p>
          <button type="button" className="btn" onClick={onBack}>
            Value another company
          </button>
        </div>
      </Stage>
    </div>
  );
}

function ManualFigures({ financials, onEdit }: { financials: Financials; onEdit: () => void }) {
  const rows: [string, string][] = [
    ['Free cash flow', formatBig(financials.fcf0)],
    ['Cash', formatBig(financials.cash)],
    ['Total debt', formatBig(financials.debt)],
    ['Shares outstanding', formatShareCount(financials.sharesOutstanding)],
    ['Share price you entered', financials.currentPrice !== null ? formatPerShare(financials.currentPrice) : '—'],
  ];
  return (
    <div className="card manual-figures">
      <dl className="figure-grid">
        {rows.map(([label, value]) => (
          <div className="figure-card" key={label}>
            <dt>{label}</dt>
            <dd>
              <span className="figure-value num">{value}</span>
              <span className="source-tag manual">Entered by you</span>
            </dd>
          </div>
        ))}
      </dl>
      <button type="button" className="link-button" onClick={onEdit}>
        Edit these figures
      </button>
    </div>
  );
}
