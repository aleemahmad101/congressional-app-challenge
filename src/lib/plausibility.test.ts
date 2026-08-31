import { describe, expect, it } from 'vitest';
import type { Financials } from './dcf';
import { auditFigures, hasErrors } from './plausibility';

/**
 * A plausible large-cap shape. No real company — the point of this module is
 * that it works without knowing any.
 */
const SANE: Financials = {
  fcf0: 8_400_000_000,
  sharesOutstanding: 1_850_000_000,
  cash: 9_100_000_000,
  debt: 14_300_000_000,
  currentPrice: 187.42,
};

const fields = (f: ReturnType<typeof auditFigures>) => f.map((x) => x.field);

describe('auditFigures — a plausible company', () => {
  it('passes a normal large cap clean', () => {
    expect(auditFigures(SANE, 0.06)).toEqual([]);
  });

  it('passes a company with no debt and no cash', () => {
    expect(auditFigures({ ...SANE, cash: 0, debt: 0 }, 0.04)).toEqual([]);
  });
});

describe('the extra-zero mistake', () => {
  it('catches a share count with one zero too many', () => {
    const findings = auditFigures({ ...SANE, sharesOutstanding: 18_500_000_000 }, 0.06);
    expect(findings.length).toBeGreaterThan(0);
    expect(fields(findings).join(' ')).toMatch(/market value|fcf0 vs market value/);
  });

  it('catches free cash flow with one zero too few', () => {
    const findings = auditFigures({ ...SANE, fcf0: 840_000_000 }, 0.06);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('catches a price that is ten times too big', () => {
    const findings = auditFigures({ ...SANE, currentPrice: 1874.2 }, 0.06);
    expect(findings.length).toBeGreaterThan(0);
  });
});

describe('the units mistake', () => {
  it('catches free cash flow entered in billions', () => {
    const findings = auditFigures({ ...SANE, fcf0: 8.4 }, 0.06);
    expect(fields(findings)).toContain('fcf0');
    expect(findings[0].message).toContain('whole dollars');
  });

  it('catches a share count entered in millions', () => {
    const findings = auditFigures({ ...SANE, sharesOutstanding: 1850 }, 0.06);
    expect(fields(findings)).toContain('sharesOutstanding');
  });

  it('catches growth entered as a percentage instead of a decimal', () => {
    const findings = auditFigures(SANE, 6);
    expect(fields(findings)).toContain('defaultGrowth');
    expect(hasErrors(findings)).toBe(true);
  });
});

describe('impossible values block the deploy', () => {
  it('treats non-positive core figures as errors, not warnings', () => {
    expect(hasErrors(auditFigures({ ...SANE, fcf0: 0 }, 0.06))).toBe(true);
    expect(hasErrors(auditFigures({ ...SANE, sharesOutstanding: 0 }, 0.06))).toBe(true);
    expect(hasErrors(auditFigures({ ...SANE, currentPrice: 0 }, 0.06))).toBe(true);
    expect(hasErrors(auditFigures({ ...SANE, cash: -1 }, 0.06))).toBe(true);
    expect(hasErrors(auditFigures({ ...SANE, debt: -1 }, 0.06))).toBe(true);
  });

  it('treats a non-finite figure as an error', () => {
    expect(hasErrors(auditFigures({ ...SANE, fcf0: NaN }, 0.06))).toBe(true);
  });

  it('rejects a growth rate outside the slider range', () => {
    expect(hasErrors(auditFigures(SANE, 0.5))).toBe(true);
    expect(hasErrors(auditFigures(SANE, -0.01))).toBe(true);
  });
});

describe('what it deliberately does not do', () => {
  it('only warns — never errors — on a merely unusual company', () => {
    // A high multiple is odd, not impossible. It must not block a deploy.
    const findings = auditFigures({ ...SANE, fcf0: 40_000_000 }, 0.06);
    expect(findings.length).toBeGreaterThan(0);
    expect(hasErrors(findings)).toBe(false);
  });

  it('accepts a heavily indebted company', () => {
    // Real telecoms and utilities carry debt on this scale against a market
    // value of a few hundred billion. It must pass clean.
    expect(auditFigures({ ...SANE, debt: 100_000_000_000 }, 0.02)).toEqual([]);
  });

  it('flags debt beyond any company balance sheet', () => {
    const findings = auditFigures({ ...SANE, debt: 3_000_000_000_000 }, 0.02);
    expect(fields(findings)).toContain('debt');
  });

  it('flags debt absurdly out of scale with the company itself', () => {
    // A $5B company cannot owe $150B — that is total liabilities, not borrowings.
    const findings = auditFigures(
      { ...SANE, currentPrice: 5, sharesOutstanding: 1_000_000_000, debt: 150_000_000_000 },
      0.02,
    );
    expect(fields(findings)).toContain('debt');
    expect(hasErrors(findings)).toBe(false);
  });

  it('has no opinion about which company it is looking at', () => {
    // Same figures under two different identities must audit identically.
    expect(auditFigures(SANE, 0.06)).toEqual(auditFigures({ ...SANE }, 0.06));
  });
});
