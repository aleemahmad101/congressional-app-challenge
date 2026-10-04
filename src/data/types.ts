/**
 * The shape of ClearValue's company data.
 *
 * Three layers, kept strictly apart so an assumption can never be mistaken for
 * a reported fact:
 *
 *   CompanyProfile   who the company is, written by hand in catalog.ts
 *   Figure           one reported number plus exactly where it came from
 *   Company          the resolved record the app renders, with its status
 */

import type { Financials } from '../lib/dcf';

export const SECTOR_GROUPS = [
  'Technology',
  'Consumer',
  'Communications',
  'Finance',
  'Healthcare',
  'Industrial',
  'Energy',
] as const;

export type SectorGroup = (typeof SECTOR_GROUPS)[number];

/**
 * Figures typed in by hand from a filing or quote page. Every field is
 * optional: anything the SEC data supplies is taken from there instead.
 *
 * `fiscalYear: SAMPLE_DATA` marks the entry as unverified placeholder data,
 * which the UI labels loudly and `npm run check:data` refuses to deploy.
 */
export interface HandEntry {
  fcf0?: number;
  sharesOutstanding?: number;
  cash?: number;
  debt?: number;
  /** e.g. "FY2025", or SAMPLE_DATA while unverified. */
  fiscalYear: string;
  /** ISO date the figures were taken, or SAMPLE_DATA. */
  snapshotDate: string;
  sources: {
    fcfSource: string;
    sharesSource: string;
  };
}

export interface CompanyProfile {
  ticker: string;
  name: string;
  group: SectorGroup;
  /** Plain-English industry, e.g. "Restaurants". Searchable. */
  industry: string;
  /** One plain sentence: what does this company actually sell? */
  whatTheyDo: string;
  /**
   * SEC filer number, only when the ticker list points somewhere unhelpful
   * (e.g. a newly created holding company with no filing history yet).
   */
  cik?: number;
  /**
   * The exact XBRL debt lines to add up, when the automatic choice was found
   * to be wrong for this company. Only set after checking the 10-K text, and
   * say why next to it.
   */
  secDebtLines?: string[];
  /**
   * Context quoted from the company's own 10-K that explains its figures,
   * e.g. a one-time payment inside last year's cash flow. Shown verbatim.
   */
  filingNote?: { quote: string; source: string };
  /** Shown in the "Start here" group for beginners. */
  popular?: boolean;
  /**
   * Set when a cash-flow model is the wrong tool for this business. The app
   * explains why instead of printing a meaningless number.
   */
  notSuitable?: string;
  /**
   * A human's starting growth assumption for years 1-5, as a decimal. When
   * absent, the starting point is derived from the company's reported history.
   */
  startingGrowth?: number;
  /**
   * Reference market price per share, in USD: a fixed snapshot used only to
   * compare against the independent estimate, never as an input to it.
   * Must be set together with `referencePriceDate`.
   */
  referencePrice?: number;
  /** ISO date of `referencePrice`, e.g. "2026-10-02". */
  referencePriceDate?: string;
  /** Figures typed by hand. See HandEntry. */
  hand?: HandEntry;
}

/* --------------------------------------------------------- provenance --- */

export type Provenance =
  /** Read straight from a 10-K via SEC EDGAR's XBRL data. */
  | {
      kind: 'filing';
      form: string;
      periodEnd: string;
      filed: string;
      accession: string;
      concepts: string[];
      url: string;
      /**
       * True when ClearValue computed the value from several reported lines
       * (e.g. cash from operations minus capital expenditures). Labelled
       * "Calculated from reported data", never "Reported".
       */
      derived: boolean;
    }
  /** A fixed reference market price, never a live quote. */
  | { kind: 'market'; date: string; priceType: string; currency: string }
  /** Typed in by hand, with a stated source. */
  | { kind: 'manual'; source: string; asOf: string }
  /** Unverified placeholder. Never presented as fact. */
  | { kind: 'sample' };

export interface Figure {
  value: number;
  provenance: Provenance;
}

export interface ReportedFigures {
  revenue?: Figure;
  operatingIncome?: Figure;
  operatingCashFlow?: Figure;
  capex?: Figure;
  freeCashFlow?: Figure;
  cash?: Figure;
  debt?: Figure;
  shares?: Figure;
  price?: Figure;
}

export type ReportedKey = keyof ReportedFigures;

export interface HistoryPoint {
  periodEnd: string;
  revenue?: number;
  freeCashFlow?: number;
}

/* ------------------------------------------------------------ resolved --- */

export type CompanyStatus =
  /** Every figure the model needs is present. */
  | 'ready'
  /** The company spends more cash than it brings in; the model cannot run. */
  | 'negative-fcf'
  /** Some required figure has not been loaded. */
  | 'needs-figures'
  /** A cash-flow model is the wrong tool (e.g. banks). */
  | 'not-suitable';

export interface StartingGrowth {
  value: number;
  basis: 'editor' | 'history' | 'default';
  /** One sentence a visitor can read. */
  note: string;
}

export interface Company extends Omit<CompanyProfile, 'startingGrowth'> {
  /** URL-safe id, e.g. "brk-b". */
  id: string;
  reported: ReportedFigures;
  history: HistoryPoint[];
  /** End of the fiscal year the reported figures describe, if known. */
  periodEnd: string | null;
  status: CompanyStatus;
  /** Human labels of required figures that are missing. */
  missing: string[];
  /** Model inputs. Null unless status is 'ready'. */
  financials: Financials | null;
  /** Resolved starting growth: the editor's choice, history, or a default. */
  startingGrowth: StartingGrowth;
  /** True when any figure on screen is unverified sample data. */
  usesSample: boolean;
  /** Notes from the data import worth showing alongside the figures. */
  dataNotes: string[];
}
