import { useState } from 'react';

/**
 * Shown when most of the bundle reads expensive at the current settings.
 *
 * Without it, a visitor who clicks three companies and sees three deep
 * negatives concludes the app is broken. It isn't — a strict required return
 * genuinely does make most large companies look expensive, and saying so is
 * the difference between a bug and a lesson.
 */
export function StrictAssumptionsNote() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <p className="notice strict" role="status">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="4.7" r="0.9" fill="currentColor" />
      </svg>
      <span>
        Strict assumptions make most large companies look expensive — that is the discount rate
        talking, not a glitch. It is what being a cautious investor looks like in numbers.
      </span>
      <button
        type="button"
        className="notice-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss this note"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M2 2l8 8M10 2l-8 8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </p>
  );
}
