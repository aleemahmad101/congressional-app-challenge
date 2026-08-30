import { describe, expect, it } from 'vitest';
import { EMPTY_DRAFT, validateDraft, type ManualDraft } from './manual';

const GOOD: ManualDraft = {
  fcf0: '8400000000',
  sharesOutstanding: '1200000000',
  cash: '3000000000',
  debt: '5000000000',
  currentPrice: '62.50',
};

describe('validateDraft', () => {
  it('turns a clean draft into numbers', () => {
    const { errors, financials } = validateDraft(GOOD);
    expect(errors).toEqual({});
    expect(financials).toEqual({
      fcf0: 8_400_000_000,
      sharesOutstanding: 1_200_000_000,
      cash: 3_000_000_000,
      debt: 5_000_000_000,
      currentPrice: 62.5,
    });
  });

  it('accepts the dollar signs and commas people actually paste in', () => {
    const { financials } = validateDraft({ ...GOOD, fcf0: ' $8,400,000,000 ' });
    expect(financials?.fcf0).toBe(8_400_000_000);
  });

  it('flags every blank field at once rather than one at a time', () => {
    const { errors, financials } = validateDraft(EMPTY_DRAFT);
    expect(Object.keys(errors)).toHaveLength(5);
    expect(financials).toBeNull();
  });

  it('allows zero for cash and debt but not for the other three', () => {
    expect(validateDraft({ ...GOOD, cash: '0', debt: '0' }).financials).not.toBeNull();
    expect(validateDraft({ ...GOOD, sharesOutstanding: '0' }).errors.sharesOutstanding).toBeTruthy();
    expect(validateDraft({ ...GOOD, currentPrice: '0' }).errors.currentPrice).toBeTruthy();
    expect(validateDraft({ ...GOOD, fcf0: '0' }).errors.fcf0).toBeTruthy();
  });

  it('rejects negatives with a message that says what to do instead', () => {
    expect(validateDraft({ ...GOOD, cash: '-1' }).errors.cash).toContain('enter 0');
    expect(validateDraft({ ...GOOD, debt: '-1' }).errors.debt).toContain('enter 0');
  });

  it('points people at the annual report when the share count is wrong', () => {
    expect(validateDraft({ ...GOOD, sharesOutstanding: '-5' }).errors.sharesOutstanding).toContain(
      'annual report',
    );
  });

  it('rejects text that is not a number', () => {
    expect(validateDraft({ ...GOOD, fcf0: 'a lot' }).errors.fcf0).toBeTruthy();
    expect(validateDraft({ ...GOOD, currentPrice: '12.3.4' }).errors.currentPrice).toBeTruthy();
  });

  it('never returns both errors and financials', () => {
    const drafts = [GOOD, EMPTY_DRAFT, { ...GOOD, debt: '-1' }];
    for (const draft of drafts) {
      const { errors, financials } = validateDraft(draft);
      expect(Object.keys(errors).length > 0).toBe(financials === null);
    }
  });
});
