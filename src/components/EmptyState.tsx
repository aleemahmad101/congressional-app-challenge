import { useMemo } from 'react';
import type { Company } from '../data/companies';
import { suggestedCompanies } from '../lib/spotlight';
import { CompanyCard } from './CompanyPicker';

interface EmptyStateProps {
  onSelect: (company: Company) => void;
}

export function EmptyState({ onSelect }: EmptyStateProps) {
  // Computed, never hardcoded: the first card is whichever company lands
  // nearest a neutral verdict, so nobody's first impression is "68% overvalued".
  // Re-sorts itself automatically when the verified figures land.
  const suggested = useMemo(() => suggestedCompanies(3), []);

  return (
    <section className="card empty">
      <h2>Pick a company and watch it get valued.</h2>
      <p>
        Most Americans own stock through a retirement account without ever seeing how a
        company&apos;s worth is worked out. Here is the actual method, running live.
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
