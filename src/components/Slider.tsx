import { useId } from 'react';
import { formatRate } from '../lib/dcf';

interface SliderProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Spoken value for screen readers, e.g. "9.25 percent". */
  ariaValueText?: string;
}

/**
 * The custom range control from the design system: 6px track, 24px thumb,
 * and a mono badge that rides above the thumb. Arrow keys move one step —
 * that comes free with the native input, which is why it is still one.
 */
export function Slider({ label, hint, value, min, max, step, onChange, ariaValueText }: SliderProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const fraction = (value - min) / (max - min);

  // The thumb centre travels between 12px and (track - 12px), so the badge
  // has to ease off pure percentage at both ends to stay over the thumb.
  const badgeLeft = `calc(${fraction * 100}% + ${(0.5 - fraction) * 24}px)`;

  return (
    <div className="slider-row">
      <div className="slider-head">
        <label htmlFor={id}>{label}</label>
      </div>
      {hint && (
        <p className="slider-hint" id={hintId}>
          {hint}
        </p>
      )}
      <div className="slider-wrap">
        <span className="slider-badge" style={{ left: badgeLeft }} aria-hidden="true">
          {formatRate(value)}
        </span>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-describedby={hint ? hintId : undefined}
          aria-valuetext={ariaValueText ?? `${formatRate(value)} per year`}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <div className="scale-ends" aria-hidden="true">
          <span>{formatRate(min)}</span>
          <span>{formatRate(max)}</span>
        </div>
      </div>
    </div>
  );
}
