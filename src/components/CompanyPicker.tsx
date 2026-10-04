import { useDeferredValue, useId, useMemo, useState } from 'react';
import {
  COMPANIES,
  POPULAR_COMPANIES,
  READY_COMPANIES,
  SECTOR_GROUPS,
  countByGroup,
  monogram,
  searchCompanies,
  type Company,
  type SectorGroup,
} from '../data/companies';

type Filter = SectorGroup | 'All';

const BROWSE_LIMIT = 12;

const STATUS_LABEL: Record<Company['status'], string | null> = {
  ready: null,
  'needs-figures': 'Figures needed',
  'negative-fcf': 'Burns cash',
  'not-suitable': 'Valued differently',
};

/** Ready companies first; within each, the catalog's own order. */
function readyFirst(list: Company[]): Company[] {
  const rank = (c: Company) => (c.status === 'ready' ? 0 : c.status === 'negative-fcf' ? 1 : 2);
  return [...list].sort((a, b) => rank(a) - rank(b));
}

interface CompanyCardProps {
  company: Company;
  onSelect: (company: Company) => void;
  /** Position in the grid, for the staggered entrance. */
  index?: number;
}

export function CompanyCard({ company, onSelect, index = 0 }: CompanyCardProps) {
  const status = STATUS_LABEL[company.status];
  return (
    <li className="card-enter" style={{ '--i': Math.min(index, 12) } as React.CSSProperties}>
      <a
        className={`company-card${company.status === 'ready' ? '' : ' muted'}`}
        href={`?company=${company.id}`}
        onClick={(event) => {
          // Let new-tab and new-window clicks behave like any other link.
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          onSelect(company);
        }}
      >
        <span className={`monogram group-${company.group.toLowerCase()}`} aria-hidden="true">
          {monogram(company)}
        </span>
        <span className="card-text">
          <span className="name">{company.name}</span>
          <span className="meta">
            <span className="ticker">{company.ticker}</span>
            <span aria-hidden="true"> · </span>
            {company.industry}
          </span>
          {status ? (
            <span className={`status-chip status-${company.status}`}>{status}</span>
          ) : company.usesSample ? (
            <span className="status-chip status-sample">Sample figures</span>
          ) : null}
        </span>
        <span className="card-cta" aria-hidden="true">
          {company.status === 'ready' ? 'Value' : 'Open'}
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path
              d="M3 8h9.5M8.5 4l4 4-4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </a>
    </li>
  );
}

interface CompanyPickerProps {
  onSelect: (company: Company) => void;
  onManual: () => void;
}

export function CompanyPicker({ onSelect, onManual }: CompanyPickerProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [readyOnly, setReadyOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const searchId = useId();

  const counts = useMemo(() => countByGroup(COMPANIES), []);
  const results = useMemo(() => {
    const found = searchCompanies(deferredQuery, COMPANIES, filter);
    const pool = readyOnly ? found.filter((c) => c.status === 'ready') : found;
    // While searching, relevance decides the order. Browsing, ready ones lead.
    return deferredQuery.trim() ? pool : readyFirst(pool);
  }, [deferredQuery, filter, readyOnly]);

  const browsing = !query.trim() && filter === 'All';
  // Sixty cards at once overwhelms a beginner; browsing shows a first page.
  const collapsed = browsing && !showAll && results.length > BROWSE_LIMIT;
  const visible = collapsed ? results.slice(0, BROWSE_LIMIT) : results;
  const notReady = COMPANIES.length - READY_COMPANIES.length;

  return (
    <section className="picker" id="companies" aria-labelledby="picker-title">
      <div className="section-head">
        <p className="eyebrow">Step one</p>
        <h2 className="section-title" id="picker-title">
          Pick a company you know
        </h2>
        <p className="lede">
          {COMPANIES.length} well-known U.S. companies across {SECTOR_GROUPS.length} industries.
          Search by name, ticker, or what they sell.
        </p>
      </div>

      {browsing && POPULAR_COMPANIES.length > 0 && (
        <div className="popular">
          <h3 className="eyebrow popular-label">New to this? Start here</h3>
          <ul className="company-grid popular-grid">
            {POPULAR_COMPANIES.map((company, i) => (
              <CompanyCard key={company.id} company={company} onSelect={onSelect} index={i} />
            ))}
          </ul>
        </div>
      )}

      <div className="picker-controls">
        <div className="search">
          <label htmlFor={searchId} className="visually-hidden">
            Search companies
          </label>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.8 10.8 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “Nike”, “NVDA”, “coffee”, or “banking”"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="filters" role="group" aria-label="Filter by industry">
          {(['All', ...SECTOR_GROUPS] as Filter[]).map((group) => (
            <button
              key={group}
              type="button"
              className="filter-chip"
              aria-pressed={filter === group}
              onClick={() => setFilter(group)}
            >
              {group}
              <span className="filter-count" aria-hidden="true">
                {counts[group]}
              </span>
            </button>
          ))}
        </div>

        {notReady > 0 && (
          <label className="ready-toggle">
            <input
              type="checkbox"
              checked={readyOnly}
              onChange={(event) => setReadyOnly(event.target.checked)}
            />
            Only companies ready to value
          </label>
        )}
      </div>

      <p className="results-count" role="status" aria-live="polite">
        {results.length === 0
          ? 'No matches'
          : collapsed
            ? `Showing ${visible.length} of ${results.length} companies — search or pick an industry to narrow down`
          : `${results.length} ${results.length === 1 ? 'company' : 'companies'}${
              filter === 'All' ? '' : ` in ${filter}`
            }${query.trim() ? ` matching “${query.trim()}”` : ''}`}
      </p>

      {results.length > 0 ? (
        <ul className="company-grid" key={`${filter}-${readyOnly}`}>
          {visible.map((company, i) => (
            <CompanyCard key={company.id} company={company} onSelect={onSelect} index={i} />
          ))}
        </ul>
      ) : (
        <div className="picker-empty">
          <p>
            No company here matches “{query}”{filter === 'All' ? '' : ` in ${filter}`}.
          </p>
          <div className="button-row center">
            {filter !== 'All' && (
              <button type="button" className="btn ghost" onClick={() => setFilter('All')}>
                Search all industries
              </button>
            )}
            <button type="button" className="btn ghost" onClick={onManual}>
              Enter a company’s figures yourself
            </button>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="button-row center">
          <button type="button" className="btn ghost" onClick={() => setShowAll(true)}>
            Show all {results.length} companies
          </button>
        </div>
      )}

      <p className="picker-foot">
        Not listed?{' '}
        <button type="button" className="link-button" onClick={onManual}>
          Value any company from its annual report
        </button>
      </p>
    </section>
  );
}
