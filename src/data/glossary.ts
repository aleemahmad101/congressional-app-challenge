/**
 * Learn Mode definitions.
 *
 * House rules for this file: two sentences maximum, no term defined using
 * another undefined term, and one concrete example that a beginner can
 * picture. Read every entry out loud — if it sounds like a textbook, rewrite it.
 */

export interface GlossaryEntry {
  /** Title case, as it appears in the popover heading. */
  title: string;
  definition: string;
  example: string;
}

export const GLOSSARY = {
  'free-cash-flow': {
    title: 'Free cash flow',
    definition:
      'The cash a company has left over after paying for everything it needs to keep running, including new equipment. It is the money that can actually go to owners.',
    example:
      'A pizza shop takes in $500,000, spends $430,000 on rent, staff, and a new oven, and keeps $70,000. That $70,000 is its free cash flow.',
  },
  'discount-rate': {
    title: 'Discount rate',
    definition:
      'How much less a future dollar is worth to you than a dollar today. A higher rate means you are more impatient, or the cash is riskier.',
    example:
      'At a 9% discount rate, $100 arriving one year from now is worth about $92 to you today.',
  },
  'terminal-value': {
    title: 'Terminal value',
    definition:
      'A single number standing in for every dollar the company earns after year five, because nobody can forecast that far year by year. It usually makes up most of the total.',
    example:
      'Instead of guessing years 6 through 200 one at a time, we assume steady slow growth forever and roll it into one figure.',
  },
  'terminal-growth': {
    title: 'Terminal growth',
    definition:
      'How fast we assume the company grows forever after year five. It has to stay low, because nothing can outgrow the whole economy indefinitely.',
    example:
      'We default to 2.5% a year, roughly the pace the U.S. economy has grown over the long run.',
  },
  'shares-outstanding': {
    title: 'Shares outstanding',
    definition:
      'The number of slices the company is cut into. Owning one share means owning one of those slices.',
    example:
      'If a company is worth $1 billion and has 100 million shares, each share represents $10 of the company.',
  },
  'market-cap': {
    title: 'Market cap',
    definition:
      'What the stock market currently says the whole company is worth: share price multiplied by the number of shares.',
    example: 'A $50 share price across 200 million shares is a $10 billion market cap.',
  },
  upside: {
    title: 'Upside',
    definition:
      'The gap between our estimate and the current price, as a percentage. Positive means our estimate is higher than the market price; negative means lower.',
    example: 'If we estimate $120 and the stock trades at $100, that is 20% upside.',
  },
  'present-value': {
    title: 'Present value',
    definition:
      'What a future payment is worth if you had to accept it today instead. Money later is always worth less than money now.',
    example:
      '$1,000 arriving in five years, discounted at 9% a year, is worth about $650 in your hand today.',
  },
  'enterprise-value': {
    title: 'Enterprise value',
    definition:
      'What the whole business operation is worth, before counting the cash in its bank account or the debt it owes.',
    example:
      'Think of buying a house: enterprise value is the price of the house itself, before you settle the seller’s mortgage.',
  },
  'equity-value': {
    title: 'Equity value',
    definition:
      'What is left for shareholders after adding the company’s cash and paying off its debt. Dividing this by the share count gives the fair value per share.',
    example:
      'A business worth $10 billion with $2 billion of cash and $3 billion of debt leaves $9 billion for shareholders.',
  },
  'total-debt': {
    title: 'Total debt',
    definition:
      'Money the company has borrowed and must pay back. It gets subtracted because lenders get paid before shareholders do.',
    example: 'Bonds the company sold to investors and loans from banks both count as debt.',
  },
  dcf: {
    title: 'Discounted cash flow',
    definition:
      'A way of valuing a company by estimating the cash it will produce in the future and adjusting each year down to what it is worth today. It is the method used across professional finance.',
    example:
      'Every number on this page comes from one discounted cash flow model — the same shape professionals build in spreadsheets.',
  },
} as const satisfies Record<string, GlossaryEntry>;

export type TermKey = keyof typeof GLOSSARY;
