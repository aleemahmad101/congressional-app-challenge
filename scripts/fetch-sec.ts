/**
 * Downloads every catalog company's reported figures from SEC EDGAR and
 * writes them, with a citation for each number, to src/data/sec-financials.json.
 *
 *   SEC_USER_AGENT="Your Name aleehmad01@gmail.com" npm run data:fetch
 *   npm run data:fetch -- AAPL NKE        # only some tickers (merges)
 *
 * EDGAR is free and needs no API key, but the SEC asks every automated client
 * to identify itself with a name and email in the User-Agent header, and to
 * stay under ten requests a second. This script does both.
 *
 * Nothing here is estimated. A figure the 10-K data does not contain is left
 * out and reported below, and the app shows that company as missing it.
 * Share prices are not in SEC filings; add those by hand in catalog.ts.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG } from '../src/data/catalog';
import { extractSecRecord, type CompanyFacts, type SecRecord } from '../src/lib/sec';

const here = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(here, '../src/data/sec-financials.json');

const USER_AGENT = process.env.SEC_USER_AGENT?.trim();
const PAUSE_MS = 150;

interface TickerRow {
  cik_str: number;
  ticker: string;
  title: string;
}

interface OutputFile {
  generatedAt: string | null;
  source: string;
  records: Record<string, SecRecord>;
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

async function getJson<T>(url: string): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT as string, Accept: 'application/json' },
    });
    if (response.ok) return (await response.json()) as T;
    if (response.status === 403) {
      throw new Error(
        `Request refused (403). Check SEC_USER_AGENT is "Your Name aleehmad01@gmail.com" — the SEC requires it — and that no network proxy or firewall blocks sec.gov.`,
      );
    }
    if (response.status === 404) throw new Error(`Not found: ${url}`);
    await sleep(1000 * attempt);
  }
  throw new Error(`Gave up after 3 attempts: ${url}`);
}

/** SEC writes share classes with a hyphen: BRK.B is "BRK-B". */
const secTicker = (ticker: string) => ticker.replace('.', '-').toUpperCase();

function readExisting(): OutputFile {
  try {
    return JSON.parse(readFileSync(OUTPUT, 'utf8')) as OutputFile;
  } catch {
    return { generatedAt: null, source: '', records: {} };
  }
}

async function main(): Promise<void> {
  if (!USER_AGENT) {
    console.error('\n  Set SEC_USER_AGENT first — the SEC requires a name and email:\n');
    console.error('    SEC_USER_AGENT="Your Name aleehmad01@gmail.com" npm run data:fetch\n');
    process.exit(1);
  }

  const only = process.argv.slice(2).map((t) => t.toUpperCase());
  const targets = CATALOG.filter((c) => only.length === 0 || only.includes(c.ticker.toUpperCase()));
  if (targets.length === 0) {
    console.error(`  No catalog company matches ${only.join(', ')}.`);
    process.exit(1);
  }

  console.log('\n  Loading the SEC ticker list…');
  const tickers = await getJson<Record<string, TickerRow>>(
    'https://www.sec.gov/files/company_tickers.json',
  );
  const cikByTicker = new Map(Object.values(tickers).map((row) => [row.ticker.toUpperCase(), row.cik_str]));

  const output = readExisting();
  output.source =
    'SEC EDGAR XBRL company facts (data.sec.gov). Regenerate with: npm run data:fetch';
  // A full run replaces everything, so companies removed from the catalog go too.
  if (only.length === 0) output.records = {};

  const failed: string[] = [];
  const withIssues: SecRecord[] = [];

  for (const profile of targets) {
    const cik = profile.cik ?? cikByTicker.get(secTicker(profile.ticker));
    if (!cik) {
      failed.push(`${profile.ticker}: not in the SEC ticker list`);
      continue;
    }
    const padded = String(cik).padStart(10, '0');
    try {
      await sleep(PAUSE_MS);
      const doc = await getJson<CompanyFacts>(
        `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`,
      );
      const record = extractSecRecord(profile.ticker, doc, { debtLines: profile.secDebtLines });
      if (!record) {
        failed.push(`${profile.ticker}: no annual cash-flow data (does it file 10-Ks?)`);
        continue;
      }
      output.records[profile.ticker] = record;
      if (record.issues.length > 0) withIssues.push(record);
      const fcf = record.history.at(-1)?.freeCashFlow;
      console.log(
        `  ✓ ${profile.ticker.padEnd(6)} FY ending ${record.periodEnd}` +
          (fcf !== undefined ? `  FCF $${(fcf / 1e9).toFixed(2)}B` : '  FCF —'),
      );
    } catch (error) {
      failed.push(`${profile.ticker}: ${(error as Error).message}`);
    }
  }

  output.generatedAt = new Date().toISOString();
  writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);

  console.log(`\n  Wrote ${Object.keys(output.records).length} companies to src/data/sec-financials.json`);

  if (withIssues.length > 0) {
    console.log('\n  Worth a look (the app shows these notes too):');
    for (const record of withIssues) {
      for (const issue of record.issues) console.log(`    ${record.ticker.padEnd(6)} ${issue}`);
    }
  }
  if (failed.length > 0) {
    console.log('\n  Not loaded:');
    for (const line of failed) console.log(`    ${line}`);
  }
  console.log('\n  Next: npm run check:data\n');
}

main().catch((error) => {
  console.error(`\n  ${(error as Error).message}\n`);
  process.exit(1);
});
