import { formatDate, formatPriceDate } from '../data/companies';
import type { Figure } from '../data/types';

interface SourceTagProps {
  figure?: Figure;
  /** For values ClearValue works out from reported ones (e.g. margins). */
  calculated?: boolean;
  /** Overrides the calculated label, for values that are not purely reported data. */
  calculatedLabel?: string;
}

/**
 * The small label that says where a number came from. Four kinds, and they
 * never blur:
 *   Reported · 10-K                 one line, straight from the filing
 *   Calculated from reported data   arithmetic on reported lines
 *   Reference market price          a closing price on a fixed date
 *   Your assumption                 gold, on the assumption controls
 * Filing-based tags link to the filing, so every figure stays traceable.
 */
export function SourceTag({ figure, calculated = false, calculatedLabel }: SourceTagProps) {
  if (calculated) {
    return <span className="source-tag calculated">{calculatedLabel ?? 'Calculated from reported data'}</span>;
  }
  if (!figure) return <span className="source-tag missing">Not available</span>;

  const p = figure.provenance;
  if (p.kind === 'sample') {
    return <span className="source-tag sample">Sample — unverified</span>;
  }
  if (p.kind === 'market') {
    return (
      <span className="source-tag market" title={`${p.priceType}, ${p.currency}`}>
        Closing price · {formatPriceDate(p.date)}
      </span>
    );
  }
  if (p.kind === 'manual') {
    return (
      <span className="source-tag reported" title={p.source}>
        Reported · entered {formatDate(p.asOf)}
      </span>
    );
  }

  const lines = p.concepts.map((c) => c.replace(/^us-gaap:|^dei:/, '')).join(' + ');
  return (
    <a
      className={`source-tag ${p.derived ? 'calculated linked' : 'reported'}`}
      href={p.url}
      target="_blank"
      rel="noreferrer"
      title={`${p.form} filed ${p.filed}, period ending ${p.periodEnd} · ${lines}`}
    >
      {p.derived ? 'Calculated from reported data' : `Reported · ${p.form}`}
      <span className="visually-hidden">
        {' '}
        ({p.derived ? `from ${p.concepts.length} lines of the ${p.form}; ` : ''}opens the SEC filing in a
        new tab)
      </span>
    </a>
  );
}
