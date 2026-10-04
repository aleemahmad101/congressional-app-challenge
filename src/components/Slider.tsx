import { useId, useState } from 'react';
import { clamp, formatRate } from '../lib/dcf';
import { useLearnMode } from '../learn-mode';

interface SliderProps {
  label: React.ReactNode;
  /** The plain-English question, shown while "Explain everything" is on. */
  hint?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Spoken value for screen readers, e.g. "9.25 percent". */
  ariaValueText?: string;
  /** Where this assumption started, marked on the track. */
  start?: number;
  /** Reported context shown beside the control, e.g. "Past 4 yrs: 6.2%". */
  context?: React.ReactNode;
  /** A gentle caution about the current value. */
  warning?: string | null;
}

/** Percent text in the number box: 9.25 → "9.25", 6 → "6". */
function asPercentText(value: number): string {
  return String(Math.round(value * 10_000) / 100);
}

/**
 * Assumption control: a native range input (so arrow keys, touch and screen
 * readers work for free) paired with an editable percentage box.
 */
export function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  ariaValueText,
  start,
  context,
  warning,
}: SliderProps) {
  const id = useId();
  // The plain-English question is teaching copy: shown in Explain mode only.
  const showHint = useLearnMode() && !!hint;
  const hintId = `${id}-hint`;
  const numberId = `${id}-number`;
  const warningId = `${id}-warning`;
  const fraction = (clamp(value, min, max) - min) / (max - min);
  const startFraction = start === undefined ? null : (clamp(start, min, max) - min) / (max - min);

  // The box holds free text while typing and commits on blur or Enter;
  // otherwise it simply shows the current value.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? asPercentText(value);

  const commit = () => {
    if (draft === null) return;
    setDraft(null);
    const typed = Number(draft.replace('%', '').trim());
    if (draft.trim() === '' || !Number.isFinite(typed)) return;
    // Hundredths of a point: fine enough for 9.25%, coarse enough to stay readable.
    const next = clamp(Math.round(typed * 100) / 10_000, min, max);
    if (Math.abs(next - value) > 1e-9) onChange(next);
  };

  const describedBy = [showHint ? hintId : null, warning ? warningId : null].filter(Boolean).join(' ');

  return (
    <div className={`slider-row${warning ? ' has-warning' : ''}`}>
      <div className="slider-head">
        <label htmlFor={id}>{label}</label>
        <span className="assumption-tag">Your assumption</span>
      </div>
      {showHint && (
        <p className="slider-hint explain-in" id={hintId}>
          {hint}
        </p>
      )}

      <div className="slider-control">
        <div className="slider-wrap" style={{ '--f': fraction } as React.CSSProperties}>
          {startFraction !== null && (
            <span
              className="start-mark"
              style={{ left: `calc(${startFraction * 100}% + ${(0.5 - startFraction) * 24}px)` }}
              aria-hidden="true"
              title={`Starting point: ${formatRate(start as number)}`}
            />
          )}
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            aria-describedby={describedBy || undefined}
            aria-valuetext={ariaValueText ?? `${formatRate(value)} per year`}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <div className="scale-ends" aria-hidden="true">
            <span>{formatRate(min)}</span>
            <span>{formatRate(max)}</span>
          </div>
        </div>

        <div className="number-field">
          <label htmlFor={numberId} className="visually-hidden">
            {label} — type a percentage
          </label>
          <input
            id={numberId}
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit();
              }
              if (event.key === 'Escape') setDraft(null);
            }}
          />
          <span className="number-unit" aria-hidden="true">
            %
          </span>
        </div>
      </div>

      {context && <div className="slider-context">{context}</div>}

      {warning && (
        <p className="slider-warning" id={warningId}>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1.8 15 14H1z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 6.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.8" r="0.85" fill="currentColor" />
          </svg>
          {warning}
        </p>
      )}
    </div>
  );
}
