/**
 * Downloads the latest regular-session closing price for every catalog
 * company and writes it, with its date, to src/data/prices.json.
 *
 *   npm run data:prices
 *
 * Runs after every U.S. trading day in GitHub Actions
 * (.github/workflows/prices.yml), which then rebuilds and redeploys the site.
 * No API key: closing prices come from Stooq's free daily quotes, with
 * Yahoo Finance's public chart data as a fallback for any symbol Stooq misses.
 *
 * A price is kept only if it is positive, dated within the last ten days, and
 * not wildly different from the stored one (a sign of a bad quote). Anything
 * that fails keeps its previous price and is reported, never guessed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG } from '../src/data/catalog';

const here = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(here, '../src/data/prices.json');
const USER_AGENT = 'ClearValue price update (+https://github.com/aleemahmad101/congressional-app-challenge)';
const DAY = 86_400_000;
const MAX_AGE_DAYS = 10;
/** A day-over-day move bigger than this is treated as a bad quote. */
const MAX_JUMP = 0.5;

export interface PriceEntry {
  close: number;
  /** ISO date of the trading day that close belongs to. */
  date: string;
  source: 'Stooq' | 'Yahoo Finance';
}

export interface PriceFile {
  generatedAt: string | null;
  source: string;
  prices: Record<string, PriceEntry>;
}

function readExisting(): PriceFile {
  try {
    return JSON.parse(readFileSync(OUTPUT, 'utf8')) as PriceFile;
  } catch {
    return { generatedAt: null, source: '', prices: {} };
  }
}

/** Stooq writes U.S. listings as "aapl.us" and share classes as "brk-b.us". */
const stooqSymbol = (ticker: string) => `${ticker.replace('.', '-').toLowerCase()}.us`;
const yahooSymbol = (ticker: string) => ticker.replace('.', '-').toUpperCase();

async function get(url: string): Promise<string> {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} from ${new URL(url).host}`);
  return response.text();
}

/** One request for every symbol: Symbol,Date,Time,Close. */
async function fromStooq(tickers: string[]): Promise<Map<string, PriceEntry>> {
  const found = new Map<string, PriceEntry>();
  const bySymbol = new Map(tickers.map((t) => [stooqSymbol(t).toUpperCase(), t]));
  // Stooq accepts a comma-separated list; keep each request modest.
  for (let i = 0; i < tickers.length; i += 20) {
    const batch = tickers.slice(i, i + 20).map(stooqSymbol).join(',');
    const csv = await get(`https://stooq.com/q/l/?s=${batch}&f=sd2t2c&h&e=csv`);
    for (const line of csv.trim().split('\n').slice(1)) {
      const [symbol, date, , close] = line.split(',');
      const ticker = bySymbol.get(symbol?.toUpperCase());
      const value = Number(close);
      if (ticker && /^\d{4}-\d{2}-\d{2}$/.test(date) && value > 0 && !unfinished(date)) {
        found.set(ticker, { close: value, date, source: 'Stooq' });
      }
    }
  }
  return found;
}

interface YahooChart {
  chart: {
    result?: {
      meta: { regularMarketPrice?: number; currency?: string };
      timestamp?: number[];
      indicators: { quote: { close: (number | null)[] }[] };
    }[];
  };
}

/** The last completed daily bar from Yahoo's public chart data. */
async function fromYahoo(ticker: string): Promise<PriceEntry | null> {
  const json = JSON.parse(
    await get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol(ticker)}?range=10d&interval=1d`),
  ) as YahooChart;
  const result = json.chart.result?.[0];
  const times = result?.timestamp ?? [];
  const closes = result?.indicators.quote[0]?.close ?? [];
  if (result?.meta.currency && result.meta.currency !== 'USD') return null;
  for (let i = times.length - 1; i >= 0; i--) {
    const close = closes[i];
    const date = newYorkDate(new Date(times[i] * 1000));
    if (close && close > 0 && !unfinished(date)) {
      return { close: Math.round(close * 100) / 100, date, source: 'Yahoo Finance' };
    }
  }
  return null;
}

const newYorkDate = (when: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(when);

/**
 * True for today's quote while the regular session (until 4 p.m. New York)
 * is still running: that is the latest trade, not a closing price yet.
 */
function unfinished(date: string): boolean {
  const now = new Date();
  if (date !== newYorkDate(now)) return false;
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).format(now),
  );
  return hour < 16;
}

function problemWith(entry: PriceEntry, previous: PriceEntry | undefined): string | null {
  const age = (Date.now() - Date.parse(entry.date)) / DAY;
  if (!(age >= -1 && age <= MAX_AGE_DAYS)) return `close dated ${entry.date} is not recent`;
  if (previous && entry.date >= previous.date) {
    const jump = Math.abs(entry.close / previous.close - 1);
    if (jump > MAX_JUMP) return `moved ${(jump * 100).toFixed(0)}% from ${previous.close} — check before trusting it`;
  }
  return null;
}

async function main(): Promise<void> {
  const tickers = CATALOG.map((c) => c.ticker);
  const output = readExisting();
  const fresh = new Map<string, PriceEntry>();
  const failed: string[] = [];

  try {
    for (const [ticker, entry] of await fromStooq(tickers)) fresh.set(ticker, entry);
  } catch (error) {
    console.log(`  Stooq unavailable (${(error as Error).message}); trying Yahoo Finance for every symbol.`);
  }

  for (const ticker of tickers.filter((t) => !fresh.has(t))) {
    try {
      const entry = await fromYahoo(ticker);
      if (entry) fresh.set(ticker, entry);
    } catch (error) {
      failed.push(`${ticker}: ${(error as Error).message}`);
    }
  }

  let updated = 0;
  for (const ticker of tickers) {
    const entry = fresh.get(ticker);
    const previous = output.prices[ticker];
    if (!entry) {
      if (!failed.some((f) => f.startsWith(`${ticker}:`))) failed.push(`${ticker}: no quote returned`);
      continue;
    }
    const problem = problemWith(entry, previous);
    if (problem) {
      failed.push(`${ticker}: ${problem}${previous ? ' (kept the previous price)' : ''}`);
      continue;
    }
    output.prices[ticker] = entry;
    updated++;
  }
  // Companies removed from the catalog go too.
  for (const ticker of Object.keys(output.prices)) if (!tickers.includes(ticker)) delete output.prices[ticker];

  const dates = [...new Set(Object.values(output.prices).map((p) => p.date))].sort();
  console.log(`\n  ${updated} of ${tickers.length} closing prices updated; latest close ${dates.at(-1) ?? '—'}.`);
  for (const ticker of tickers) {
    const p = output.prices[ticker];
    console.log(`    ${ticker.padEnd(6)} ${p ? `$${p.close.toFixed(2).padStart(8)}  ${p.date}  ${p.source}` : '—'}`);
  }
  if (failed.length > 0) {
    console.log('\n  Not updated:');
    for (const line of failed) console.log(`    ${line}`);
  }
  // A run that updates almost nothing means the sources are down: fail
  // loudly, and leave the saved prices exactly as they were.
  if (updated < tickers.length * 0.8) {
    console.error(`\n  Only ${updated} prices updated — nothing saved, not deploying.`);
    process.exit(1);
  }

  output.generatedAt = new Date().toISOString();
  output.source = 'Regular-session closing prices (USD) from Stooq, or Yahoo Finance when Stooq has none. Regenerate with: npm run data:prices';
  writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  console.log('\n  Saved src/data/prices.json');
}

main().catch((error) => {
  console.error(`\n  ${(error as Error).message}\n`);
  process.exit(1);
});
