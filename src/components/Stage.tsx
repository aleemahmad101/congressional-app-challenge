import { forwardRef } from 'react';

interface StageProps {
  id: string;
  number: number;
  title: string;
  /** One line under the title. Always visible. */
  intro?: React.ReactNode;
  children: React.ReactNode;
  done?: boolean;
}

/** One numbered step of the valuation story. */
export const Stage = forwardRef<HTMLElement, StageProps>(function Stage(
  { id, number, title, intro, children, done = false },
  ref,
) {
  return (
    <section className="stage" id={id} ref={ref} aria-labelledby={`${id}-title`}>
      <header className="stage-head">
        <span className={`stage-number${done ? ' done' : ''}`} aria-hidden="true">
          {done ? (
            <svg width="14" height="14" viewBox="0 0 16 16">
              <path
                d="M3 8.5l3.2 3L13 4.8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            number
          )}
        </span>
        <div>
          <p className="stage-kicker">Step {number}</p>
          <h2 className="stage-title" id={`${id}-title`}>
            {title}
          </h2>
          {intro && <p className="stage-intro">{intro}</p>}
        </div>
      </header>
      <div className="stage-body">{children}</div>
    </section>
  );
});
