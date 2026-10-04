import { formatBig } from '../lib/dcf';
import { scrollToSection } from '../hooks';
import { startingYearCheck, type Company } from '../data/companies';

interface StartingYearNoticeProps {
  company: Company;
  /** Compact: one line beside the estimate, pointing back to step 1. */
  compact?: boolean;
}

/**
 * Says so when the model's starting year looks unusual for this company —
 * the single biggest reason a cash-flow estimate can mislead. It changes no
 * number; the visitor decides what to do with the growth slider.
 */
export function StartingYearNotice({ company, compact = false }: StartingYearNoticeProps) {
  const check = startingYearCheck(company.history);
  if (!check && !company.filingNote) return null;

  if (compact) {
    return (
      <p className="notice starting-year compact" role="note">
        <span>
          <strong>Unusual starting year.</strong> This estimate starts from{' '}
          {company.name}’s latest free cash flow, which{' '}
          {check ? `was well ${check.direction} its usual level` : 'included one-time items'}.{' '}
          <button type="button" className="link-button" onClick={() => scrollToSection('stage-today')}>
            See why in step 1
          </button>
        </span>
      </p>
    );
  }

  return (
    <aside className="notice starting-year" aria-labelledby="starting-year-title">
      <div>
        <p className="starting-year-title" id="starting-year-title">
          Is last year a fair starting point?
        </p>
        {check && (
          <p>
            Last year’s free cash flow ({formatBig(check.latest)}) was well {check.direction} its
            typical level over the {check.priorYears} years before (about {formatBig(check.typical)}).
            One-time payments or receipts — or a business that is genuinely changing — can cause
            that. The model starts from last year, so every estimate here inherits it.
          </p>
        )}
        {company.filingNote && (
          <blockquote className="filing-quote">
            <p>“{company.filingNote.quote}”</p>
            <cite>{company.filingNote.source}</cite>
          </blockquote>
        )}
        <p>
          ClearValue does not adjust reported figures. If you think last year was unusual, that is
          a judgement you can express with the growth assumption in step 2.
        </p>
      </div>
    </aside>
  );
}
