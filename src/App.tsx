import { useMemo, useState } from 'react';
import {
  DEFAULT_DISCOUNT_RATE,
  DEFAULT_TERMINAL_GROWTH,
  runDcf,
  type Assumptions,
  type Financials,
} from './lib/dcf';
import { assumptionsAreStrict, neutralCompany } from './lib/spotlight';
import { HAS_SAMPLE_DATA, dataVintage, isSampleData, type Company } from './data/companies';
import { useSessionPreference, usePrintExpandsDetails } from './hooks';
import { LearnModeContext } from './learn-mode';
import { EMPTY_DRAFT, type ManualDraft } from './lib/manual';
import { AssumptionPanel } from './components/AssumptionPanel';
import { CompanyChip, CompanyPicker } from './components/CompanyPicker';
import { EmptyState } from './components/EmptyState';
import { Header } from './components/Header';
import { ManualMode } from './components/ManualMode';
import { RiverOfCash } from './components/RiverOfCash';
import { StrictAssumptionsNote } from './components/StrictAssumptionsNote';
import { UnderTheHood } from './components/UnderTheHood';
import { Verdict } from './components/Verdict';
import { WhyIBuiltThis } from './components/WhyIBuiltThis';

/**
 * Three ways the page can be: nothing chosen yet, a bundled company selected,
 * or a hand-entered set of figures. Everything else is derived.
 */
type Subject =
  | { kind: 'none' }
  | { kind: 'company'; company: Company }
  | { kind: 'manual'; financials: Financials };

export default function App() {
  usePrintExpandsDetails();

  // Explain-everything is ON for first-time visitors: the teaching layer is
  // the app's whole point, and a toggle nobody flips teaches nobody.
  const [learnMode, setLearnMode] = useSessionPreference('clearvalue.learnMode', true);

  const [subject, setSubject] = useState<Subject>({ kind: 'none' });
  const [showManual, setShowManual] = useState(false);
  const [draft, setDraft] = useState<ManualDraft>(EMPTY_DRAFT);
  const [assumptions, setAssumptions] = useState<Assumptions>({
    // Opens on whichever company reads nearest neutral, so the first thing a
    // visitor meets is a balanced verdict rather than a scary one.
    growthRate: neutralCompany()?.defaultGrowth ?? 0.06,
    discountRate: DEFAULT_DISCOUNT_RATE,
    terminalGrowth: DEFAULT_TERMINAL_GROWTH,
  });

  const financials: Financials | null =
    subject.kind === 'company'
      ? subject.company
      : subject.kind === 'manual'
        ? subject.financials
        : null;

  // Six exponentials and a division. Cheap enough to run on every input event.
  const result = useMemo(
    () => (financials ? runDcf(financials, assumptions) : null),
    [financials, assumptions],
  );

  // Ten companies re-valued on every slider move — still trivial, still sync.
  const strict = useMemo(() => assumptionsAreStrict(assumptions), [assumptions]);

  const pickCompany = (company: Company) => {
    setSubject({ kind: 'company', company });
    setShowManual(false);
    // Each company carries its own sensible starting growth; the other two
    // assumptions are the visitor's and stay where they left them.
    setAssumptions((prev) => ({ ...prev, growthRate: company.defaultGrowth }));
  };

  return (
    <LearnModeContext.Provider value={learnMode}>
      <div className="shell">
        <Header learnMode={learnMode} onToggleLearnMode={() => setLearnMode(!learnMode)} />

        <main>
          <section className="zone" aria-label="Choose what to value">
            {showManual ? (
              <ManualMode
                draft={draft}
                onDraftChange={setDraft}
                onSubmit={(entered) => {
                  setSubject({ kind: 'manual', financials: entered });
                  setShowManual(false);
                }}
                onCancel={() => setShowManual(false)}
              />
            ) : subject.kind === 'company' ? (
              <CompanyChip
                company={subject.company}
                onChange={() => setSubject({ kind: 'none' })}
              />
            ) : subject.kind === 'manual' ? (
              <div className="card chip">
                <span className="monogram lg" aria-hidden="true">
                  YOU
                </span>
                <div>
                  <h2>Your figures</h2>
                  <span className="ticker num">Entered by hand</span>
                </div>
                <p className="what">
                  Valued from the five numbers you typed in, using exactly the same model.
                </p>
                <button type="button" className="link-button" onClick={() => setShowManual(true)}>
                  Edit the numbers
                </button>
              </div>
            ) : (
              <CompanyPicker onSelect={pickCompany} onManual={() => setShowManual(true)} />
            )}

            {financials && result && (
              <AssumptionPanel
                assumptions={assumptions}
                onChange={setAssumptions}
                result={result}
                learnMode={learnMode}
              />
            )}
          </section>

          <section className="zone" aria-label="Valuation">
            {financials && result ? (
              <>
                {strict && <StrictAssumptionsNote />}
                <Verdict
                  result={result}
                  financials={financials}
                  assumptions={assumptions}
                  companyName={subject.kind === 'company' ? subject.company.name : 'this company'}
                  vintage={subject.kind === 'company' ? dataVintage(subject.company) : null}
                  isSample={subject.kind === 'company' && isSampleData(subject.company)}
                />
                <RiverOfCash
                  result={result}
                  discountRate={assumptions.discountRate}
                  learnMode={learnMode}
                />
                <UnderTheHood financials={financials} assumptions={assumptions} result={result} />
              </>
            ) : (
              !showManual && <EmptyState onSelect={pickCompany} />
            )}
          </section>

          <WhyIBuiltThis />
        </main>

        <footer className="disclaimer">
          <span>
            Educational tool. Not investment advice.{' '}
            {HAS_SAMPLE_DATA
              ? 'Company figures are unverified sample data and must not be relied on.'
              : 'Company figures come from published annual reports, not live market data.'}
          </span>
          <span>Built for the Congressional App Challenge.</span>
        </footer>
      </div>
    </LearnModeContext.Provider>
  );
}
