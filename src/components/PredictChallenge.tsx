import { useEffect, useState } from 'react';
import { formatPerShare, type Assumptions, type Financials } from '../lib/dcf';
import { buildChallenge, type PredictQuestion } from '../lib/predict';

interface PredictChallengeProps {
  financials: Financials;
  assumptions: Assumptions;
  onApply: (patch: Partial<Assumptions>) => void;
}

/**
 * "Predict, then reveal": guess how the estimate will move, then watch the
 * model answer. Questions are frozen when the challenge starts, so moving a
 * slider mid-question cannot change the answer under the visitor.
 */
export function PredictChallenge({ financials, assumptions, onApply }: PredictChallengeProps) {
  // Rebuilt only on "Start over", from whatever the settings are then.
  const [questions, setQuestions] = useState(() => buildChallenge(financials, assumptions));
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const finished = index >= questions.length;
  const question = questions[index];
  const chosen = answers[index];
  const score = answers.filter((a, i) => a === questions[i]?.correct).length;

  const restart = () => {
    setQuestions(buildChallenge(financials, assumptions));
    setRound((r) => r + 1);
    setIndex(0);
    setAnswers([]);
  };

  if (questions.length === 0) return null;

  return (
    <section className="card predict" aria-labelledby="predict-title">
      <div className="predict-head">
        <p className="eyebrow">Predict, then reveal</p>
        <h3 className="group-title" id="predict-title">
          Test your intuition
        </h3>
        {!finished && (
          <p className="predict-progress num" aria-label={`Question ${index + 1} of ${questions.length}`}>
            {index + 1}/{questions.length}
          </p>
        )}
      </div>

      {finished ? (
        <div className="predict-recap" aria-live="polite">
          <p className="predict-score">
            You predicted <strong className="num">{score}</strong> of{' '}
            <strong className="num">{questions.length}</strong> correctly.
          </p>
          <p className="predict-recap-lead">What the model showed you:</p>
          <ul>
            {questions.map((q) => (
              <li key={q.id}>{q.takeaway}</li>
            ))}
          </ul>
          <button type="button" className="btn ghost" onClick={restart}>
            Start over with my current settings
          </button>
        </div>
      ) : (
        <>
          <p className="predict-prompt">{question.prompt}</p>
          <div className="predict-options" role="group" aria-label="Your prediction">
            {question.options.map((option) => {
              const state =
                chosen === undefined
                  ? ''
                  : option.id === question.correct
                    ? ' correct'
                    : option.id === chosen
                      ? ' wrong'
                      : '';
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`predict-option${state}`}
                  aria-pressed={chosen === option.id}
                  disabled={chosen !== undefined}
                  onClick={() => setAnswers((prev) => [...prev.slice(0, index), option.id])}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div aria-live="polite">
            {chosen !== undefined && (
              <Reveal
                key={`${round}-${index}`}
                question={question}
                right={chosen === question.correct}
                onTry={question.tryIt ? () => onApply(question.tryIt as Partial<Assumptions>) : null}
                onNext={() => setIndex((i) => i + 1)}
                last={index === questions.length - 1}
              />
            )}
          </div>
        </>
      )}
    </section>
  );
}

interface RevealProps {
  question: PredictQuestion;
  right: boolean;
  onTry: (() => void) | null;
  onNext: () => void;
  last: boolean;
}

function Reveal({ question, right, onTry, onNext, last }: RevealProps) {
  // Bars start at the visitor's own estimate, then move to their answers.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const start = question.bars[0].value;
  const scale = Math.max(...question.bars.map((b) => Math.abs(b.value)), 1e-9);

  return (
    <div className="predict-reveal">
      <p className={`predict-verdict${right ? ' right' : ''}`}>
        {right ? 'You got it.' : 'Not quite.'}
      </p>

      <ul className="predict-bars">
        {question.bars.map((bar, i) => {
          const value = revealed || i === 0 ? bar.value : start;
          return (
            <li key={bar.label}>
              <span className="predict-bar-label">{bar.label}</span>
              <span className="predict-bar-track" aria-hidden="true">
                <span
                  className={`predict-bar-fill${i === 0 ? ' base' : ''}`}
                  style={{ width: `${(Math.max(value, 0) / scale) * 100}%` }}
                />
              </span>
              <span className="predict-bar-value num">{formatPerShare(bar.value)}</span>
            </li>
          );
        })}
      </ul>

      <p className="predict-explain">{question.explanation}</p>

      <div className="predict-actions">
        {onTry && (
          <button type="button" className="btn ghost small" onClick={onTry}>
            Apply this to my valuation
          </button>
        )}
        <button type="button" className="btn small" onClick={onNext}>
          {last ? 'See what you learned' : 'Next question'}
          <span aria-hidden="true"> →</span>
        </button>
      </div>
    </div>
  );
}
