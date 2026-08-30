import { useState } from 'react';
import type { Financials } from '../lib/dcf';
import { FIELDS, draftProblems, validateDraft, type ManualDraft, type ManualErrors } from '../lib/manual';

interface ManualModeProps {
  draft: ManualDraft;
  onDraftChange: (draft: ManualDraft) => void;
  onSubmit: (financials: Financials) => void;
  onCancel: () => void;
}

export function ManualMode({ draft, onDraftChange, onSubmit, onCancel }: ManualModeProps) {
  const [errors, setErrors] = useState<ManualErrors>({});
  const [attempted, setAttempted] = useState(false);

  const revalidate = (next: ManualDraft) => {
    if (attempted) setErrors(validateDraft(next).errors);
  };

  const burnsCash = draftProblems(draft).includes('negative-fcf');

  return (
    <section className="card manual" aria-labelledby="manual-title">
      <h2 className="section-title" id="manual-title">
        Enter the numbers yourself
      </h2>
      <p className="lede">
        Five figures from any company&apos;s annual report and we will value it the same way.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setAttempted(true);
          const { errors: found, financials } = validateDraft(draft);
          setErrors(found);
          if (financials) onSubmit(financials);
        }}
      >
        <div className="field-grid">
          {FIELDS.map((field) => {
            const error = errors[field.key];
            const errorId = `${field.key}-error`;
            return (
              <div className="field" key={field.key}>
                <label htmlFor={field.key}>{field.label}</label>
                <p className="unit">{field.unit}</p>
                <input
                  id={field.key}
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft[field.key]}
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => {
                    const next = { ...draft, [field.key]: event.target.value };
                    onDraftChange(next);
                    revalidate(next);
                  }}
                />
                {error && (
                  <p className="error" id={errorId}>
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {burnsCash && (
          <p className="notice" role="status">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 4.5v4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11.4" r="0.9" fill="currentColor" />
            </svg>
            <span>
              This company spends more cash than it brings in. That is common for young or
              fast-growing businesses, and it is a real thing to know — but a discounted cash flow
              model has no cash to discount, so it cannot value them. Investors use other methods
              here, usually based on revenue or on what similar companies have sold for.
            </span>
          </p>
        )}

        <details className="helper">
          <summary>Where do I find these?</summary>
          <div className="helper-body">
            <p>
              Every public company in the U.S. has to publish an annual report, called a 10-K, and
              anyone can read it for free. Free finance sites list the same figures under a tab
              called “Financials”.
            </p>
            <ul>
              <li>
                <strong>Free cash flow</strong> — on the cash flow statement, take “cash from
                operating activities” and subtract “capital expenditures”.
              </li>
              <li>
                <strong>Shares outstanding</strong> — on the cover page of the 10-K, or on the
                balance sheet.
              </li>
              <li>
                <strong>Cash and total debt</strong> — both on the balance sheet. Debt means
                borrowings, not everything the company owes.
              </li>
              <li>
                <strong>Share price</strong> — any finance site, or your brokerage app.
              </li>
            </ul>
          </div>
        </details>

        <div className="button-row">
          <button type="submit" className="btn">
            Value this company
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Back to the company list
          </button>
        </div>
      </form>
    </section>
  );
}
