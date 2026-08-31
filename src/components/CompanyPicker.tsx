import { useMemo, useState } from 'react';
import {
  COMPANIES,
  HAS_SAMPLE_DATA,
  monogram,
  searchCompanies,
  type Company,
} from '../data/companies';

interface CompanyCardProps {
  company: Company;
  selected?: boolean;
  onSelect: (company: Company) => void;
}

export function CompanyCard({ company, selected = false, onSelect }: CompanyCardProps) {
  return (
    <li>
      <button
        type="button"
        className="company-card"
        aria-pressed={selected}
        onClick={() => onSelect(company)}
      >
        <span className="monogram" aria-hidden="true">
          {monogram(company)}
        </span>
        <span>
          <span className="name">{company.name}</span>
          <br />
          <span className="ticker">{company.ticker}</span>
        </span>
      </button>
    </li>
  );
}

interface CompanyPickerProps {
  selectedId?: string;
  onSelect: (company: Company) => void;
  onManual: () => void;
}

export function CompanyPicker({ selectedId, onSelect, onManual }: CompanyPickerProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchCompanies(query, COMPANIES), [query]);

  return (
    <section aria-labelledby="picker-title">
      <div className="picker-head">
        <div>
          <h2 className="section-title" id="picker-title">
            Pick a company
          </h2>
          {/* Wording is driven by the data itself, so it can never overstate
              what has actually been verified. Flips automatically once
              `npm run check:data` passes. */}
          <p className="lede">
            {HAS_SAMPLE_DATA
              ? `${COMPANIES.length} companies you already know, with sample financial data (verification in progress).`
              : `${COMPANIES.length} companies you already know, with financial snapshots from their annual reports.`}
          </p>
        </div>
        <button type="button" className="link-button" onClick={onManual}>
          Or enter your own numbers
        </button>
      </div>

      <div className="search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.8 10.8 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, ticker, or industry"
          aria-label="Search companies"
        />
      </div>

      {results.length > 0 ? (
        <ul className="company-grid">
          {results.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              selected={company.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : (
        <p className="picker-empty">
          No company here matches “{query}”. Try a ticker like AAPL, or{' '}
          <button type="button" className="link-button" onClick={onManual}>
            enter the numbers yourself
          </button>
          .
        </p>
      )}
    </section>
  );
}

interface CompanyChipProps {
  company: Company;
  onChange: () => void;
}

/** What the picker collapses to once a company is chosen. */
export function CompanyChip({ company, onChange }: CompanyChipProps) {
  return (
    <div className="card chip">
      <span className="monogram lg" aria-hidden="true">
        {monogram(company)}
      </span>
      <div>
        <h2>{company.name}</h2>
        <span className="ticker num">
          {company.ticker} · {company.sector}
        </span>
      </div>
      <p className="what">{company.whatTheyDo}</p>
      <button type="button" className="link-button" onClick={onChange}>
        Change company
      </button>
    </div>
  );
}
