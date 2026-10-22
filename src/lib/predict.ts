/**
 * "Predict, then reveal": three questions about how the model behaves.
 *
 * Every answer is computed by running the real model on the company in front
 * of the visitor — nothing is hard-coded — so the reveal always matches what
 * the sliders would show.
 */

import {
  DISCOUNT_RANGE,
  GROWTH_RANGE,
  MIN_TERMINAL_SPREAD,
  TERMINAL_RANGE,
  formatBig,
  formatRate,
  runDcf,
  type Assumptions,
  type Financials,
} from './dcf';

export interface PredictOption {
  id: string;
  label: string;
}

export interface PredictQuestion {
  id: 'discount' | 'growth-vs-forever' | 'pay-debt';
  prompt: string;
  options: PredictOption[];
  correct: string;
  /** Estimates per share to compare on reveal; the first is where you started. */
  bars: { label: string; value: number }[];
  /** Why the answer is what it is. One or two plain sentences. */
  explanation: string;
  /** One line for the closing recap. */
  takeaway: string;
  /** Assumptions to try on the sliders, if the question changed any. */
  tryIt?: Partial<Assumptions>;
}

/** Moves smaller than a tenth of a cent per share count as "no change". */
const SAME = 0.001;

function direction(before: number, after: number): 'rise' | 'fall' | 'same' {
  if (Math.abs(after - before) < SAME) return 'same';
  return after > before ? 'rise' : 'fall';
}

const RISE_FALL: PredictOption[] = [
  { id: 'rise', label: 'It rises' },
  { id: 'fall', label: 'It falls' },
  { id: 'same', label: 'It stays the same' },
];

const STEP = 0.01;

/** Keeps 9% + 1 point at exactly 0.1, so the sliders and URL stay tidy. */
const tidy = (rate: number) => Math.round(rate * 10_000) / 10_000;

function discountQuestion(financials: Financials, assumptions: Assumptions): PredictQuestion {
  const base = runDcf(financials, assumptions).fairValuePerShare;
  // Ask about a higher return unless that would leave the slider's range.
  const up = assumptions.discountRate + STEP <= DISCOUNT_RANGE.max;
  const discountRate = tidy(assumptions.discountRate + (up ? STEP : -STEP));
  const changed = runDcf(financials, { ...assumptions, discountRate }).fairValuePerShare;

  return {
    id: 'discount',
    prompt: up
      ? `You decide you need a higher return: ${formatRate(discountRate)} a year instead of ${formatRate(assumptions.discountRate)}. Does today’s estimated value rise or fall?`
      : `You decide you can accept a lower return: ${formatRate(discountRate)} a year instead of ${formatRate(assumptions.discountRate)}. Does today’s estimated value rise or fall?`,
    options: RISE_FALL,
    correct: direction(base, changed),
    bars: [
      { label: `Now, at ${formatRate(assumptions.discountRate)}`, value: base },
      { label: `At ${formatRate(discountRate)}`, value: changed },
    ],
    explanation: up
      ? 'Demanding more from your money means every future dollar is worth less to you today, so the same cash adds up to a smaller value. The company did not change. Your standard did.'
      : 'Accepting less from your money means every future dollar is worth more to you today, so the same cash adds up to a bigger value. The company did not change. Your standard did.',
    takeaway: 'A higher required return lowers the estimate; a lower one raises it.',
    tryIt: { discountRate },
  };
}

function growthQuestion(financials: Financials, assumptions: Assumptions): PredictQuestion | null {
  const base = runDcf(financials, assumptions);
  // Both nudges must be real moves the sliders can make.
  const growthRate = tidy(assumptions.growthRate + STEP);
  const terminalGrowth = tidy(base.effectiveTerminalGrowth + STEP);
  if (growthRate > GROWTH_RANGE.max) return null;
  if (terminalGrowth > TERMINAL_RANGE.max) return null;
  if (terminalGrowth > assumptions.discountRate - MIN_TERMINAL_SPREAD) return null;

  const fiveYears = runDcf(financials, { ...assumptions, growthRate }).fairValuePerShare;
  const forever = runDcf(financials, { ...assumptions, terminalGrowth }).fairValuePerShare;
  const foreverWins = forever - base.fairValuePerShare > fiveYears - base.fairValuePerShare;

  return {
    id: 'growth-vs-forever',
    prompt:
      'Which moves the estimate more: one extra point of growth for the next five years, or one extra point of growth every year after year five?',
    options: [
      { id: 'five', label: 'One more point for five years' },
      { id: 'forever', label: 'One more point after year five' },
    ],
    correct: foreverWins ? 'forever' : 'five',
    bars: [
      { label: 'Now', value: base.fairValuePerShare },
      { label: `Five years at ${formatRate(growthRate)}`, value: fiveYears },
      { label: `After year five at ${formatRate(terminalGrowth)}`, value: forever },
    ],
    explanation: foreverWins
      ? 'Growth after year five never stops, so even a small change compounds over decades. That is why the long-term assumption deserves the most caution.'
      : 'Here, the next five years matter more: with these settings the cash after year five is discounted heavily enough that the near-term boost wins. Most companies go the other way.',
    takeaway: foreverWins
      ? 'Growth that lasts forever moves the estimate more than growth that lasts five years.'
      : 'Which assumption matters most depends on the company and your other settings.',
    tryIt: foreverWins ? { terminalGrowth } : { growthRate },
  };
}

function debtQuestion(financials: Financials, assumptions: Assumptions): PredictQuestion | null {
  if (financials.cash <= 0 || financials.debt <= 0) return null;
  const base = runDcf(financials, assumptions).fairValuePerShare;
  // Pay down as much debt as the cash allows, or half the debt — whichever is smaller.
  const paid = Math.min(financials.cash, financials.debt / 2);
  const after = runDcf(
    { ...financials, cash: financials.cash - paid, debt: financials.debt - paid },
    assumptions,
  ).fairValuePerShare;
  const amount = formatBig(paid);

  return {
    id: 'pay-debt',
    prompt: `The company uses ${amount} of its cash to pay off ${amount} of its debt. What happens to the estimated value per share?`,
    options: RISE_FALL,
    correct: direction(base, after),
    bars: [
      { label: 'Before paying', value: base },
      { label: 'After paying', value: after },
    ],
    explanation:
      'Cash adds to what shareholders own and debt subtracts from it. Paying debt with cash shrinks both by the same amount, so what is left for each share stays the same. The business itself did not change.',
    takeaway: 'Moving money between cash and debt does not change what the business is worth.',
  };
}

/** The challenge for one company at the visitor's current settings. */
export function buildChallenge(financials: Financials, assumptions: Assumptions): PredictQuestion[] {
  return [
    discountQuestion(financials, assumptions),
    growthQuestion(financials, assumptions),
    debtQuestion(financials, assumptions),
  ].filter((q): q is PredictQuestion => q !== null);
}
