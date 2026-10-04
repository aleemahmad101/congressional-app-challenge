import { formatDelta, formatPerShare } from '../lib/dcf';
import { scrollToSection, useCountUp } from '../hooks';

export interface StageInfo {
  id: string;
  short: string;
}

interface StageNavProps {
  stages: StageInfo[];
  active: number;
  estimate: number | null;
  upside: number | null;
}

/**
 * The sticky progress bar: where you are in the six steps, and the live
 * estimate — so moving a slider in step 2 visibly changes the answer.
 */
export function StageNav({ stages, active, estimate, upside }: StageNavProps) {
  const shown = useCountUp(estimate ?? 0, 220);
  const progress = ((active + 1) / stages.length) * 100;

  return (
    <nav className="stage-nav" aria-label="Valuation steps">
      <div className="stage-nav-inner">
        <ol className="stage-steps">
          {stages.map((stage, i) => (
            <li key={stage.id}>
              <button
                type="button"
                className={`stage-step${i === active ? ' current' : ''}${i < active ? ' done' : ''}`}
                aria-current={i === active ? 'step' : undefined}
                onClick={() => scrollToSection(stage.id)}
              >
                <span className="stage-dot" aria-hidden="true">
                  {i < active ? '✓' : i + 1}
                </span>
                <span className="stage-step-label">{stage.short}</span>
              </button>
            </li>
          ))}
        </ol>

        <p className="stage-compact" aria-hidden="true">
          <span className="num">
            {active + 1}/{stages.length}
          </span>{' '}
          {stages[active]?.short}
        </p>

        {estimate !== null && (
          <button
            type="button"
            className="live-estimate"
            onClick={() => scrollToSection(stages[4]?.id ?? stages[stages.length - 1].id)}
          >
            <span className="live-label">Your estimate</span>
            <span className={`live-value num${estimate < 0 ? ' negative' : ''}`}>
              {formatPerShare(shown)}
            </span>
            {upside !== null && (
              <span className={`live-delta num${upside < 0 ? ' down' : ''}`}>{formatDelta(upside)}</span>
            )}
            <span className="visually-hidden"> — go to the result</span>
          </button>
        )}
      </div>
      <div className="stage-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
    </nav>
  );
}
