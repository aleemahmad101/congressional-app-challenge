/**
 * Deploy gate for the bundled company figures.
 *
 * The app ships with sample data so it can be developed and demoed, but sample
 * data must never reach a judge presented as real. This script is the thing
 * standing between the two: it fails, loudly and specifically, until every
 * figure has been checked against a filing and its source recorded.
 *
 *   npm run check:data
 *
 * It deliberately does not check whether the numbers are *correct* — no script
 * can do that. It checks that a human has been through every one of them.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { COMPANIES, SAMPLE_DATA, type Company } from '../src/data/companies';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_FILE = resolve(here, '../src/data/companies.ts');

interface Problem {
  company: string;
  missing: string[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function auditCompany(company: Company): Problem | null {
  const missing: string[] = [];

  if (company.fiscalYear === SAMPLE_DATA || company.fiscalYear.trim() === '') {
    missing.push('fiscalYear (e.g. "FY2025")');
  }
  if (company.snapshotDate === SAMPLE_DATA || !ISO_DATE.test(company.snapshotDate)) {
    missing.push('snapshotDate (YYYY-MM-DD)');
  }
  if (!company.sources.fcfSource.trim()) missing.push('sources.fcfSource');
  if (!company.sources.sharesSource.trim()) missing.push('sources.sharesSource');
  if (!ISO_DATE.test(company.sources.priceAsOf)) missing.push('sources.priceAsOf (YYYY-MM-DD)');

  return missing.length > 0 ? { company: `${company.name} (${company.ticker})`, missing } : null;
}

/** Counts the per-number markers still sitting in the data file. */
function countVerifyMarkers(): number {
  const source = readFileSync(SOURCE_FILE, 'utf8');
  return source
    .split('\n')
    // Skip lines inside the block comment at the top, which talks *about*
    // the markers; only trailing markers on real figures count.
    .filter((line) => !line.trim().startsWith('*'))
    .filter((line) => /\/\/\s*VERIFY\b/.test(line)).length;
}

function main(): void {
  const problems = COMPANIES.map(auditCompany).filter((p): p is Problem => p !== null);
  const markers = countVerifyMarkers();

  if (problems.length === 0 && markers === 0) {
    console.log(`\n  ✓ All ${COMPANIES.length} companies verified. Safe to deploy.\n`);
    process.exit(0);
  }

  console.error('\n  ✗ Company data is not verified yet — do not deploy.\n');

  if (markers > 0) {
    console.error(`  ${markers} figure${markers === 1 ? '' : 's'} still marked // VERIFY in`);
    console.error('  src/data/companies.ts. Replace each with a figure from the filing,');
    console.error('  then delete its marker.\n');
  }

  if (problems.length > 0) {
    console.error(`  ${problems.length} of ${COMPANIES.length} companies missing provenance:\n`);
    for (const problem of problems) {
      console.error(`    ${problem.company}`);
      for (const field of problem.missing) console.error(`      · ${field}`);
    }
    console.error('');
  }

  console.error('  Work through data/VERIFICATION.md one company at a time.');
  console.error('  Roughly 15 minutes each; ten companies you can defend beat twenty you cannot.\n');
  process.exit(1);
}

main();
