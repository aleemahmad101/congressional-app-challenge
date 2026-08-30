import { COMPANIES, SUGGESTED_IDS, type Company } from '../data/companies';
import { CompanyCard } from './CompanyPicker';

interface EmptyStateProps {
  onSelect: (company: Company) => void;
}

export function EmptyState({ onSelect }: EmptyStateProps) {
  const suggested = SUGGESTED_IDS.map((id) => COMPANIES.find((c) => c.id === id)).filter(
    (c): c is Company => Boolean(c),
  );

  return (
    <section className="card empty">
      <h2>Pick a company and watch it get valued.</h2>
      <p>
        Most Americans own stock through a retirement account without ever seeing how a company&apos;s
        worth is worked out. Here is the actual method, running live.
      </p>
      {/* The full grid is above; these three are here so nobody has to scroll
          back up to get started. */}
      <p className="eyebrow suggested-label">Start with one of these</p>
      <ul className="suggested">
        {suggested.map((company) => (
          <CompanyCard key={company.id} company={company} onSelect={onSelect} />
        ))}
      </ul>
    </section>
  );
}
