import { useEffect } from 'react';
import { useSessionFlag } from '../hooks';

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const STEPS = [
  {
    title: 'The outline is the cash itself',
    body: 'This faint outline is all the free cash we think the company brings in during year 3 — before any adjustment for time.',
  },
  {
    title: 'The gap is the cost of waiting',
    body: 'The solid bar is shorter because that money arrives years from now. The missing slice is what waiting costs you.',
  },
  {
    title: 'Add it all up',
    body: 'The bracket sums every solid bar. That total is what the whole business is worth today — and dividing it among the shares gives the number at the top.',
  },
];

interface WalkthroughProps {
  step: number | null;
  onStepChange: (step: number | null) => void;
}

/**
 * A three-beat tour of the chart, shown once per browser session when Learn
 * Mode is on. It sits below the figure rather than floating over it, so it
 * never covers the thing it is pointing at.
 */
export function Walkthrough({ step, onStepChange }: WalkthroughProps) {
  const [seen, markSeen] = useSessionFlag('clearvalue.walkthrough');

  useEffect(() => {
    if (!seen && step === null) onStepChange(0);
    // Runs once, when Learn Mode first reveals the walkthrough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (step === null) return null;

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  const finish = () => {
    markSeen();
    onStepChange(null);
  };

  return (
    <aside className="walkthrough" aria-label="Guided tour of the chart">
      <span className="step-count">
        Step {step + 1} of {STEPS.length}
      </span>
      <h4>{current.title}</h4>
      <p>{current.body}</p>
      <div className="walkthrough-actions">
        <button type="button" className="skip" onClick={finish}>
          Skip the tour
        </button>
        <button
          type="button"
          className="next"
          onClick={() => (last ? finish() : onStepChange(step + 1))}
        >
          {last ? 'Got it' : 'Next'}
        </button>
      </div>
    </aside>
  );
}
