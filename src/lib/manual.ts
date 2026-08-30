import { findProblems, type Financials, type ViabilityProblem } from './dcf';

export interface ManualDraft {
  fcf0: string;
  sharesOutstanding: string;
  cash: string;
  debt: string;
  currentPrice: string;
}

export const EMPTY_DRAFT: ManualDraft = {
  fcf0: '',
  sharesOutstanding: '',
  cash: '',
  debt: '',
  currentPrice: '',
};

type FieldKey = keyof ManualDraft;

export const FIELDS: {
  key: FieldKey;
  label: string;
  unit: string;
  /** Zero is fine for cash and debt; not for the others. */
  allowZero: boolean;
  whenBlank: string;
  whenNotPositive: string;
}[] = [
  {
    key: 'fcf0',
    label: 'Free cash flow, last year',
    unit: 'In dollars. 8.4 billion is 8400000000.',
    allowZero: false,
    whenBlank: 'Free cash flow is the one number this model cannot run without.',
    whenNotPositive:
      'This model needs a company that generates cash. See the note below for what to do instead.',
  },
  {
    key: 'sharesOutstanding',
    label: 'Shares outstanding',
    unit: 'The number of shares the company is divided into.',
    allowZero: false,
    whenBlank: 'Enter the share count so we can work out a per-share value.',
    whenNotPositive:
      'Shares outstanding must be a positive number. Find it on the first page of the company’s annual report.',
  },
  {
    key: 'cash',
    label: 'Cash and equivalents',
    unit: 'In dollars. Enter 0 if the company holds none.',
    allowZero: true,
    whenBlank: 'Enter the cash balance, or 0 if there is none.',
    whenNotPositive: 'Cash cannot be negative. If the company holds none, enter 0.',
  },
  {
    key: 'debt',
    label: 'Total debt',
    unit: 'In dollars. Enter 0 if the company has none.',
    allowZero: true,
    whenBlank: 'Enter total debt, or 0 if the company has none.',
    whenNotPositive: 'Debt cannot be negative. If the company owes nothing, enter 0.',
  },
  {
    key: 'currentPrice',
    label: 'Share price today',
    unit: 'In dollars per share.',
    allowZero: false,
    whenBlank: 'Enter the share price so we have something to compare our estimate against.',
    whenNotPositive: 'Share price must be greater than zero.',
  },
];

export type ManualErrors = Partial<Record<FieldKey, string>>;

/** Validates a draft and, when it is clean, returns the numbers to model. */
export function validateDraft(draft: ManualDraft): {
  errors: ManualErrors;
  financials: Financials | null;
} {
  const errors: ManualErrors = {};
  const parsed: Partial<Record<FieldKey, number>> = {};

  for (const field of FIELDS) {
    const raw = draft[field.key].trim().replace(/[$,\s]/g, '');
    if (raw === '') {
      errors[field.key] = field.whenBlank;
      continue;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      errors[field.key] = 'That is not a number we can read. Digits and a decimal point only.';
      continue;
    }
    if (field.allowZero ? value < 0 : value <= 0) {
      errors[field.key] = field.whenNotPositive;
      continue;
    }
    parsed[field.key] = value;
  }

  if (Object.keys(errors).length > 0) return { errors, financials: null };

  return {
    errors,
    financials: {
      fcf0: parsed.fcf0 as number,
      sharesOutstanding: parsed.sharesOutstanding as number,
      cash: parsed.cash as number,
      debt: parsed.debt as number,
      currentPrice: parsed.currentPrice as number,
    },
  };
}

/**
 * Which of the model's viability problems the draft currently trips, using
 * whatever fields have been filled in so far. Drives the explainer notices,
 * which are about *why the model cannot help* rather than about typos — those
 * are `validateDraft`'s job.
 */
export function draftProblems(draft: ManualDraft): ViabilityProblem[] {
  const partial: Partial<Financials> = {};
  for (const field of FIELDS) {
    const raw = draft[field.key].trim().replace(/[$,\s]/g, '');
    if (raw === '') continue;
    const value = Number(raw);
    if (Number.isFinite(value)) partial[field.key] = value;
  }
  return findProblems(partial);
}
