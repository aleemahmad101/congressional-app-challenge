/**
 * Deploy gate for the company data.
 *
 *   npm run check:data
 *
 * Three jobs:
 *
 *   1. Honesty — no company a visitor can value may show unverified sample
 *      figures, and no `// VERIFY` marker may remain in catalog.ts.
 *   2. Plausibility — do the figures look like a real company, or did a digit
 *      slip? (src/lib/plausibility.ts)
 *   3. Coverage — which companies are ready, which are missing figures or a
 *      share price, and what the SEC import flagged.
 *
 * It cannot tell you whether a number is *correct*. Filing-sourced figures
 * carry their accession number so anyone can check; hand-entered ones carry
 * the source you recorded.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPANIES, SEC_GENERATED_AT, type Company } from '../src/data/companies';
import { auditFigures, hasErrors } from '../src/lib/plausibility';

const here = dirname(fileURLToPath(import.meta.url));
const CATALOG_FILE = resolve(here, '../src/data/catalog.ts');

const label = (c: Company) => `${c.name} (${c.ticker})`;

/** Counts the per-number markers still sitting in the catalog. */
function countVerifyMarkers(): number {
  return readFileSync(CATALOG_FILE, 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('*'))
    .filter((line) => /\/\/\s*VERIFY\b/.test(line)).length;
}

function main(): void {
  const ready = COMPANIES.filter((c) => c.status === 'ready');
  const needs = COMPANIES.filter((c) => c.status === 'needs-figures');
  const burning = COMPANIES.filter((c) => c.status === 'negative-fcf');
  const unsuitable = COMPANIES.filter((c) => c.status === 'not-suitable');
  const sample = ready.filter((c) => c.usesSample);
  const unpriced = ready.filter((c) => !c.reported.price);
  const markers = countVerifyMarkers();

  console.log(`\n  ${COMPANIES.length} companies in the catalog`);
  console.log(`    ${ready.length} ready to value`);
  console.log(`    ${needs.length} missing reported figures`);
  console.log(`    ${burning.length} with negative free cash flow (explained, not valued)`);
  console.log(`    ${unsuitable.length} valued differently (banks etc., explained on screen)`);
  console.log(
    SEC_GENERATED_AT
      ? `  SEC data downloaded ${SEC_GENERATED_AT.slice(0, 10)}`
      : '  SEC data has never been downloaded — run `npm run data:fetch`.',
  );

  let blocked = false;

  // Plausibility on everything that will actually be valued.
  const warned = ready
    .map((c) => ({ company: c, findings: auditFigures(c.financials!, c.startingGrowth.value) }))
    .filter((a) => a.findings.length > 0);
  if (warned.length > 0) {
    console.log('\n  Figures that look like a typo:');
    for (const { company, findings } of warned) {
      console.log(`    ${label(company)}`);
      for (const f of findings) console.log(`      ${f.level === 'error' ? '✗' : '?'} ${f.field} ${f.message}`);
      if (hasErrors(findings)) blocked = true;
    }
  }

  if (needs.length > 0) {
    console.log('\n  Missing figures (shown honestly as "figures needed" in the app):');
    for (const c of needs) console.log(`    ${label(c).padEnd(34)} ${c.missing.join(', ')}`);
  }

  if (unpriced.length > 0) {
    console.log('\n  No reference market price (valued, but the comparison is hidden):');
    console.log(`    ${unpriced.map((c) => c.ticker).join(', ')}`);
    console.log('    Add referencePrice + referencePriceDate in catalog.ts (closing price on REFERENCE_PRICE_DATE).');
  }

  const notes = COMPANIES.filter((c) => c.dataNotes.length > 0);
  if (notes.length > 0) {
    console.log('\n  Notes from the SEC import:');
    for (const c of notes) for (const n of c.dataNotes) console.log(`    ${c.ticker.padEnd(6)} ${n}`);
  }

  if (sample.length > 0) {
    blocked = true;
    console.log('\n  ✗ Showing unverified SAMPLE figures:');
    for (const c of sample) {
      const which = Object.entries(c.reported)
        .filter(([, f]) => f?.provenance.kind === 'sample')
        .map(([key]) => key);
      console.log(`    ${label(c).padEnd(34)} ${which.join(', ')}`);
    }
  }
  if (markers > 0) {
    blocked = true;
    console.log(`\n  ✗ ${markers} figure${markers === 1 ? '' : 's'} still marked // VERIFY in catalog.ts.`);
  }

  if (blocked) {
    console.log('\n  ✗ Company data is not ready to deploy. Checklist: data/VERIFICATION.md\n');
    process.exit(1);
  }
  console.log(`\n  ✓ No sample data on screen. ${ready.length} companies ready. Safe to deploy.\n`);
}

main();
