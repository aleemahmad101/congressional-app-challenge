import { edgarSearchUrl } from '../lib/sec';
import { READY_COMPANIES, type Company } from '../data/companies';
import { CompanyCard } from './CompanyPicker';
import { BusinessToday } from './BusinessToday';

interface CompanyUnavailableProps {
  company: Company;
  onEnterFigures: () => void;
  onSelect: (company: Company) => void;
}

/**
 * What a visitor sees when this company cannot be valued here. Each case is
 * a lesson in itself, so it is explained rather than hidden.
 */
export function CompanyUnavailable({ company, onEnterFigures, onSelect }: CompanyUnavailableProps) {
  const alternatives = READY_COMPANIES.filter((c) => c.group === company.group && c.id !== company.id)
    .concat(READY_COMPANIES.filter((c) => c.popular && c.group !== company.group))
    .slice(0, 3);

  return (
    <div className="unavailable">
      {company.status === 'not-suitable' && (
        <div className="card lesson">
          <p className="eyebrow">Why we don’t value {company.name} this way</p>
          <h2 className="lesson-title">Some businesses need a different yardstick.</h2>
          <p>{company.notSuitable}</p>
          <p>
            Recognising when a tool does not fit is part of financial literacy too. A discounted
            cash flow model works best for companies whose cash comes from selling products and
            services.
          </p>
        </div>
      )}

      {company.status === 'negative-fcf' && (
        <div className="card lesson">
          <p className="eyebrow">{company.name} is spending more cash than it brings in</p>
          <h2 className="lesson-title">There is no free cash to discount — yet.</h2>
          <p>
            In its latest reported year, {company.name}’s free cash flow was negative: it spent more
            on running and building the business than the business brought in. That is common for
            companies investing heavily or going through a rough patch, but this model starts from
            positive cash, so it cannot produce a meaningful value. Investors use other methods
            here, usually based on revenue, earnings, or what similar companies sell for.
          </p>
        </div>
      )}

      {company.status === 'needs-figures' && (
        <div className="card lesson">
          <p className="eyebrow">Figures not loaded yet</p>
          <h2 className="lesson-title">
            We haven’t loaded {company.name}’s reported figures.
          </h2>
          <p>
            Rather than guess, ClearValue leaves them blank. Missing:{' '}
            <strong>{company.missing.join(', ')}</strong>. You can still value it — every number
            you need is in its annual report (the 10-K), free on the SEC’s website.
          </p>
          <div className="button-row">
            <button type="button" className="btn" onClick={onEnterFigures}>
              Enter {company.name}’s figures myself
            </button>
            <a className="btn ghost" href={edgarSearchUrl(company.ticker)} target="_blank" rel="noreferrer">
              Open its 10-K filings
              <span className="visually-hidden"> (opens the SEC website in a new tab)</span>
            </a>
          </div>
        </div>
      )}

      {company.status === 'negative-fcf' && <BusinessToday company={company} />}

      {alternatives.length > 0 && (
        <div className="alternatives">
          <p className="eyebrow">Try one of these instead</p>
          <ul className="company-grid">
            {alternatives.map((c, i) => (
              <CompanyCard key={c.id} company={c} onSelect={onSelect} index={i} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
