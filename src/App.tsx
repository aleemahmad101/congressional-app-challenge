import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_DISCOUNT_RATE,
  DEFAULT_TERMINAL_GROWTH,
  type Assumptions,
  type Financials,
} from './lib/dcf';
import { buildSearch, parseRoute, type Route } from './lib/url';
import { openingAssumptions } from './lib/spotlight';
import { COMPANY_BY_ID, HAS_SAMPLE_DATA, SEC_GENERATED_AT, type Company } from './data/companies';
import { scrollToSection, usePrintExpandsDetails, useSessionPreference } from './hooks';
import { LearnModeContext } from './learn-mode';
import { EMPTY_DRAFT, type ManualDraft } from './lib/manual';
import { CompanyPicker } from './components/CompanyPicker';
import { CompanyUnavailable } from './components/CompanyUnavailable';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { ManualMode } from './components/ManualMode';
import { DISCLAIMER } from './components/ResultPanel';
import { ValuationView } from './components/ValuationView';
import { WhyIBuiltThis } from './components/WhyIBuiltThis';

/** Starting rates for hand-entered figures, which have no company history. */
const MANUAL_START: Assumptions = {
  growthRate: 0.06,
  discountRate: DEFAULT_DISCOUNT_RATE,
  terminalGrowth: DEFAULT_TERMINAL_GROWTH,
};

function startFor(route: Route): Assumptions {
  const company = route.company ? COMPANY_BY_ID.get(route.company) : undefined;
  return company && !route.manual ? openingAssumptions(company) : MANUAL_START;
}

function subjectKey(route: Route): string {
  return route.manual ? `manual:${route.forCompany ?? ''}` : `company:${route.company ?? ''}`;
}

function sameAssumptions(a: Assumptions, b: Assumptions): boolean {
  return (
    Math.abs(a.growthRate - b.growthRate) < 1e-9 &&
    Math.abs(a.discountRate - b.discountRate) < 1e-9 &&
    Math.abs(a.terminalGrowth - b.terminalGrowth) < 1e-9
  );
}

interface ManualResult {
  financials: Financials;
  forCompany?: string;
}

export default function App() {
  usePrintExpandsDetails();

  // Explain-everything is ON for first-time visitors: the teaching layer is
  // the app's whole point. The choice lasts for the browser session.
  const [learnMode, setLearnMode] = useSessionPreference('clearvalue.learnMode', true);

  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.search));

  // Assumptions belong to one subject. Opening a different company starts
  // over from that company's starting point (plus anything in the URL).
  const key = subjectKey(route);
  const [state, setState] = useState(() => ({
    key,
    value: { ...startFor(route), ...route.assumptions },
  }));
  let assumptions = state.value;
  if (state.key !== key) {
    assumptions = { ...startFor(route), ...route.assumptions };
    setState({ key, value: assumptions });
  }
  const setAssumptions = (value: Assumptions) => setState({ key, value });
  const start = startFor(route);

  const [draft, setDraft] = useState<ManualDraft>(EMPTY_DRAFT);
  const [manualResult, setManualResult] = useState<ManualResult | null>(null);
  const [editingManual, setEditingManual] = useState(false);

  const company = route.company && !route.manual ? COMPANY_BY_ID.get(route.company) : undefined;
  const manualFor = route.forCompany ? COMPANY_BY_ID.get(route.forCompany) : undefined;
  const unknownCompany = !!route.company && !route.manual && !company;

  /* ---------------------------------------------------------- routing --- */

  const navigate = useCallback((next: Route, anchor?: string) => {
    const search = buildSearch(next);
    window.history.pushState(null, '', `${window.location.pathname}${search}${anchor ? `#${anchor}` : ''}`);
    setRoute(next);
    if (anchor) {
      // Two frames: one for React to render the home page, one for layout.
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(anchor)));
    } else {
      window.scrollTo({ top: 0 });
    }
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Keep the address bar in step with the sliders, so refresh and shared
  // links reproduce the same valuation. Debounced: browsers throttle
  // replaceState when it is called on every slider event.
  useEffect(() => {
    if (!company || company.status !== 'ready') return;
    const timer = setTimeout(() => {
      const changed = !sameAssumptions(assumptions, openingAssumptions(company));
      const search = buildSearch({ company: company.id, assumptions: changed ? assumptions : undefined });
      try {
        window.history.replaceState(null, '', `${window.location.pathname}${search}`);
      } catch {
        /* Throttled. The next change will catch up. */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [assumptions, company]);

  useEffect(() => {
    const name = company?.name ?? manualFor?.name;
    document.title = route.manual
      ? `Enter figures${name ? ` for ${name}` : ''} — ClearValue`
      : name
        ? `Valuing ${name} — ClearValue`
        : 'ClearValue — what is a company actually worth?';
  }, [company, manualFor, route.manual]);

  const goHome = (anchor?: string) => navigate({}, anchor);
  const selectCompany = (c: Company) => navigate({ company: c.id });

  /* ------------------------------------------------------------- views --- */

  let content: React.ReactNode;

  if (route.manual) {
    const ready =
      manualResult &&
      manualResult.forCompany === route.forCompany &&
      !editingManual;
    content = ready ? (
      <ValuationView
        subject={{
          kind: 'manual',
          name: manualFor?.name ?? 'your company',
          ticker: manualFor?.ticker,
          financials: manualResult.financials,
        }}
        financials={manualResult.financials}
        assumptions={assumptions}
        start={start}
        learnMode={learnMode}
        onChange={setAssumptions}
        onReset={() => setAssumptions(start)}
        onBack={() => goHome('companies')}
        onEditManual={() => setEditingManual(true)}
      />
    ) : (
      <div className="page-narrow">
        <ManualMode
          draft={draft}
          onDraftChange={setDraft}
          forCompany={manualFor}
          onSubmit={(financials) => {
            setManualResult({ financials, forCompany: route.forCompany });
            setEditingManual(false);
            window.scrollTo({ top: 0 });
          }}
          onCancel={() =>
            manualFor ? navigate({ company: manualFor.id }) : goHome('companies')
          }
        />
      </div>
    );
  } else if (company && company.status === 'ready' && company.financials) {
    content = (
      <ValuationView
        subject={{ kind: 'company', company }}
        financials={company.financials}
        assumptions={assumptions}
        start={start}
        learnMode={learnMode}
        onChange={setAssumptions}
        onReset={() => setAssumptions(start)}
        onBack={() => goHome('companies')}
        onEditManual={() => undefined}
      />
    );
  } else if (company) {
    content = (
      <div className="valuation">
        <div className="company-banner">
          <button type="button" className="back-link" onClick={() => goHome('companies')}>
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M13 8H3.5M7.5 4l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All companies
          </button>
          <div className="banner-id">
            <span className={`monogram lg group-${company.group.toLowerCase()}`} aria-hidden="true">
              {company.ticker.replace(/[^A-Z]/g, '').slice(0, 2)}
            </span>
            <div>
              <h1 className="banner-name">{company.name}</h1>
              <p className="banner-meta">
                <span className="ticker num">{company.ticker}</span> · {company.group} ·{' '}
                {company.industry}
              </p>
            </div>
          </div>
        </div>
        <CompanyUnavailable
          company={company}
          onSelect={selectCompany}
          onEnterFigures={() => navigate({ manual: true, forCompany: company.id })}
        />
      </div>
    );
  } else {
    content = (
      <>
        {unknownCompany && (
          <p className="notice page-notice" role="status">
            We couldn’t find that company. Pick one below.
          </p>
        )}
        <Hero />
        <HowItWorks />
        <CompanyPicker onSelect={selectCompany} onManual={() => navigate({ manual: true })} />
        <WhyIBuiltThis />
      </>
    );
  }

  return (
    <LearnModeContext.Provider value={learnMode}>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Header
        learnMode={learnMode}
        onToggleLearnMode={() => setLearnMode(!learnMode)}
        onNavigate={(anchor) => goHome(anchor)}
      />
      <div className="shell">
        <main id="main" tabIndex={-1} key={key} className="view-enter">
          {content}
        </main>

        <footer className="site-footer">
          <p>{DISCLAIMER}</p>
          <p>
            {HAS_SAMPLE_DATA
              ? 'Some company figures are unverified sample data and are labelled wherever they appear. '
              : ''}
            Reported figures come from companies’ annual reports (Form 10-K)
            {SEC_GENERATED_AT ? ' via SEC EDGAR' : ''}; every figure is labelled with its source.
            Market prices are a fixed reference snapshot — regular-session closing prices on the
            date shown — not live quotes, and they never affect an estimate.
          </p>
          <p>Built for the 2026 Congressional App Challenge. No tracking, no accounts, no ads.</p>
        </footer>
      </div>
    </LearnModeContext.Provider>
  );
}
