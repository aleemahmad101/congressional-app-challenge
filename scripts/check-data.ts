/**
 * Deploy gate for the bundled company figures.
 *
 * The app ships with sample data so it can be developed and demoed, but sample
 * data must never reach a judge presented as real. This script stands between
 * the two, and does three jobs:
 *
 *   1. Provenance — has a human recorded where every figure came from?
 *   2. Plausibility — do the figures look like a real company, or did a digit
 *      slip while typing sixty numbers out of ten PDFs?
 *   3. Progress — which company should be done next?
 *
 *   npm run check:data
 *
 * It cannot tell you whether the numbers are *correct*. No script can. It tells
 * you whether a human has been through every one of them, and shouts when a
 * figure is the kind of wrong that a typo produces.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { COMPANIES, SAMPLE_DATA, type Company } from '../src/data/companies';
import { auditFigures, hasErrors, type Finding } from '../src/lib/plausibility';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE_FILE = resolve(here, '../src/data/companies.ts');

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface Audit {
  company: Company;
  missing: string[];
  findings: Finding[];
}

function auditCompany(company: Company): Audit {
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

  return { company, missing, findings: auditFigures(company, company.defaultGrowth) };
}

/** Counts the per-number markers still sitting in the data file. */
function countVerifyMarkers(): number {
  return readFileSync(SOURCE_FILE, 'utf8')
    .split('\n')
    // Skip the block comment at the top, which talks *about* the markers.
    .filter((line) => !line.trim().startsWith('*'))
    .filter((line) => /\/\/\s*VERIFY\b/.test(line)).length;
}

function main(): void {
  const audits = COMPANIES.map(auditCompany);
  const markers = countVerifyMarkers();

  const unverified = audits.filter((a) => a.missing.length > 0);
  const verified = audits.filter((a) => a.missing.length === 0);
  const warned = audits.filter((a) => a.findings.length > 0);
  const blocked = audits.filter((a) => hasErrors(a.findings));

  const label = (a: Audit) => `${a.company.name} (${a.company.ticker})`;

  // Plausibility problems are worth showing even while provenance is missing —
  // they are how you find the typo you just made.
  if (warned.length > 0) {
    console.error('\n  Figures that look like a typo:\n');
    for (const audit of warned) {
      console.error(`    ${label(audit)}`);
      for (const f of audit.findings) {
        const tag = f.level === 'error' ? '✗' : '?';
        console.error(`      ${tag} ${f.field} ${f.message}`);
      }
      console.error('');
    }
    console.error('    ✗ blocks the deploy.  ? is probably wrong — check it, then ignore');
    console.error('      if the filing really does say that.\n');
  }

  const clean = unverified.length === 0 && markers === 0 && blocked.length === 0;
  if (clean) {
    console.log(`\n  ✓ All ${COMPANIES.length} companies verified. Safe to deploy.`);
    if (warned.length > 0) {
      console.log('    (with plausibility warnings above — worth a second look.)');
    }
    console.log('');
    process.exit(0);
  }

  console.error('  ✗ Company data is not verified yet — do not deploy.\n');
  console.error(`  Progress: ${verified.length} of ${COMPANIES.length} companies done.`);
  if (markers > 0) {
    console.error(`  ${markers} figure${markers === 1 ? '' : 's'} still marked // VERIFY.\n`);
  } else {
    console.error('');
  }

  if (blocked.length > 0) {
    console.error(`  ${blocked.length} with figures that cannot be right (see above).\n`);
  }

  if (unverified.length > 0) {
    const next = unverified[0];
    console.error(`  Next up: ${label(next)}`);
    for (const field of next.missing) console.error(`    · ${field}`);
    console.error('');

    if (unverified.length > 1) {
      const rest = unverified.slice(1).map(label).join(', ');
      console.error(`  Then: ${rest}\n`);
    }
  }

  console.error('  Checklist and filing links: data/VERIFICATION.md');
  console.error('  Roughly 15 minutes each. Ten you can defend beat twenty you cannot.\n');
  process.exit(1);
}

main();
