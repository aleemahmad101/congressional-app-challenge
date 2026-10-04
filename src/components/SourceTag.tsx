import { formatDate } from '../data/companies';
import type { Figure } from '../data/types';

interface SourceTagProps {
  figure?: Figure;
  /** For values ClearValue works out from reported ones (e.g. margins). */
  calculated?: boolean;
}

/**
 * The small label that says where a number came from. Reported figures and
 * calculated ones look deliberately different from assumptions, which are
 * always gold and always say "Your assumption".
 */
export function SourceTag({ figure, calculated = false }: SourceTagProps) {
  if (calculated) {
    return <span className="source-tag calculated">Calculated</span>;
  }
  if (!figure) return <span className="source-tag missing">Not available</span>;

  const p = figure.provenance;
  if (p.kind === 'sample') {
    return <span className="source-tag sample">Sample — unverified</span>;
  }
  if (p.kind === 'manual') {
    return (
      <span className="source-tag reported" title={p.source}>
        Reported · entered {formatDate(p.asOf)}
      </span>
    );
  }
  return (
    <a
      className="source-tag reported"
      href={p.url}
      target="_blank"
      rel="noreferrer"
      title={`${p.form} filed ${p.filed} · ${p.concepts.join(' + ')}`}
    >
      Reported · {p.form}
      <span className="visually-hidden"> (opens the SEC filing in a new tab)</span>
    </a>
  );
}
