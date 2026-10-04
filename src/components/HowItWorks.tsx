import { useState } from 'react';

const STEPS = [
  {
    title: 'The company earns money',
    short: 'Sales come in, costs go out.',
    body: 'A business sells things and pays its bills. What is left after running the business and buying the equipment it needs is called free cash flow.',
    example: 'A lemonade stand sells $500, spends $420 on lemons, cups and a new cooler, and keeps $80.',
  },
  {
    title: 'Cash available to owners',
    short: 'Free cash flow is the prize.',
    body: 'Free cash flow is money the company could hand to its owners without hurting the business. It is what you are really buying when you buy a share.',
    example: 'The $80 the lemonade stand keeps could be paid out to whoever owns the stand.',
  },
  {
    title: 'Project future cash',
    short: 'Guess five years ahead.',
    body: 'Nobody knows the future, so you make an assumption: how fast will that cash grow each year? ClearValue forecasts five years, then assumes slow, steady growth after that.',
    example: 'At 10% growth, $80 this year becomes $88 next year, then about $97, and so on.',
  },
  {
    title: 'Discount it to today',
    short: 'Later money is worth less.',
    body: 'A dollar you get in five years is worth less than a dollar today — you could have invested it, and you might not get it at all. Discounting shrinks each future dollar back into today’s money.',
    example: 'At a 9% discount rate, $100 arriving in five years is worth about $65 today.',
  },
  {
    title: 'Estimate the value',
    short: 'Add it all up.',
    body: 'Add up every discounted dollar, add the cash the company already has, subtract what it owes, and split the result across all its shares. That is the estimated value of one share.',
    example: 'Change one assumption and the answer moves — which is why value is really a range.',
  },
];

/**
 * The method in five plain steps. Each one opens on click or keyboard, never
 * on hover alone, so it works the same on a phone.
 */
export function HowItWorks() {
  const [open, setOpen] = useState(0);
  const step = STEPS[open];

  return (
    <section className="how" id="how-it-works" aria-labelledby="how-title">
      <div className="section-head">
        <p className="eyebrow">How valuation works</p>
        <h2 className="section-title" id="how-title">
          Five steps from a company’s cash to a share’s value
        </h2>
        <p className="lede">
          This is a discounted cash flow model. Tap any step to see what it means.
        </p>
      </div>

      <div className="how-grid">
        <ol className="how-flow">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className="how-step"
                aria-pressed={open === i}
                aria-controls="how-detail"
                onClick={() => setOpen(i)}
              >
                <span className="how-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="how-text">
                  <span className="how-title">{s.title}</span>
                  <span className="how-short">{s.short}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="how-detail card" id="how-detail" aria-live="polite">
          <p className="eyebrow">
            Step {open + 1} of {STEPS.length}
          </p>
          <h3 key={step.title} className="how-detail-title fade-in">
            {step.title}
          </h3>
          <p key={`${step.title}-body`} className="fade-in">
            {step.body}
          </p>
          <p className="how-example fade-in" key={`${step.title}-ex`}>
            <span className="eyebrow">Example</span>
            {step.example}
          </p>
          <div className="how-nav">
            <button
              type="button"
              className="btn ghost"
              onClick={() => setOpen(Math.max(0, open - 1))}
              disabled={open === 0}
            >
              Previous
            </button>
            {open < STEPS.length - 1 ? (
              <button type="button" className="btn" onClick={() => setOpen(open + 1)}>
                Next step
              </button>
            ) : (
              <a className="btn" href="#companies">
                Try it on a company
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
