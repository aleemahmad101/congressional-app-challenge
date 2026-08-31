# Company data verification

**Status: NOT VERIFIED. The app is shipping sample data.**

Every figure in `src/data/companies.ts` is a placeholder. This file is the
checklist for replacing them. Work one company at a time — roughly 15 minutes
each — and run `npm run check:data` after each one to watch the list shrink.

Deploying is blocked until that script passes.

---

## Why this file exists

An app that presents invented financial figures as real is disqualifying if a
judge notices, and one of them will. Ten companies you can defend are worth
more than twenty you cannot. This checklist is what turns "trust me" into
"here's the filing."

**Do not let an AI assistant fill these in.** A language model recalling a
company's free cash flow from memory is the same fabrication problem in a new
costume — the numbers will look plausible and be wrong. Every figure below has
to come from a document you opened yourself.

---

## Where each number comes from

All five figures are in the company's annual report (**Form 10-K**), free at
[sec.gov/edgar](https://www.sec.gov/edgar/searchedgar/companysearch) — search
the ticker, open the most recent 10-K.

| Field | Where to find it | Notes |
| --- | --- | --- |
| `fcf0` | Cash flow statement | **Net cash from operating activities − capital expenditures.** Capex is usually "purchases of property and equipment". Do the subtraction yourself. |
| `sharesOutstanding` | 10-K cover page, or balance sheet | The cover page states shares outstanding as of a recent date. Use basic shares, not diluted, and not the weighted average. |
| `cash` | Balance sheet | "Cash and cash equivalents" plus short-term investments if the company lists them separately. |
| `debt` | Balance sheet | Short-term debt + long-term debt. **Borrowings only** — not total liabilities, not accounts payable. |
| `currentPrice` | Any quote page | Record the date you took it in `sources.priceAsOf`. |
| `defaultGrowth` | Your judgement | A sensible five-year growth assumption for this company. Look at how FCF has grown over the last 3–5 years; be conservative. This one is an opinion, not a fact — but it should be a defensible one. |

Also fill in:

- `fiscalYear` — e.g. `"FY2025"`, matching the 10-K you used.
- `snapshotDate` — `YYYY-MM-DD`, the date you did the verification.
- `sources.fcfSource` / `sources.sharesSource` — a URL to the filing, or a
  reference like `"FY2025 10-K, p. 42"`.
- `sources.priceAsOf` — `YYYY-MM-DD`.

A worked example of what a finished entry looks like is at the bottom of this
file.

---

## Checklist

Tick a box only once the figure in `companies.ts` matches the filing **and**
its `// VERIFY` marker is deleted.

### Apple (AAPL)

- [ ] `fcf0` — operating cash flow − capex
- [ ] `sharesOutstanding`
- [ ] `cash`
- [ ] `debt`
- [ ] `currentPrice`
- [ ] `defaultGrowth` (judgement call — note your reasoning)
- [ ] `fiscalYear`, `snapshotDate`, all three `sources`

### Microsoft (MSFT)

- [ ] `fcf0` — operating cash flow − capex
- [ ] `sharesOutstanding`
- [ ] `cash`
- [ ] `debt`
- [ ] `currentPrice`
- [ ] `defaultGrowth` (judgement call — note your reasoning)
- [ ] `fiscalYear`, `snapshotDate`, all three `sources`

### Costco (COST)

- [ ] `fcf0` — operating cash flow − capex
- [ ] `sharesOutstanding`
- [ ] `cash`
- [ ] `debt`
- [ ] `currentPrice`
- [ ] `defaultGrowth` (judgement call — note your reasoning)
- [ ] `fiscalYear`, `snapshotDate`, all three `sources`

### Nike (NKE)

- [ ] `fcf0` — operating cash flow − capex
- [ ] `sharesOutstanding`
- [ ] `cash`
- [ ] `debt`
- [ ] `currentPrice`
- [ ] `defaultGrowth` (judgement call — note your reasoning)
- [ ] `fiscalYear`, `snapshotDate`, all three `sources`

> Nike currently leads the suggested companies because it lands nearest a
> neutral verdict. That ordering is computed, so it will re-sort itself once
> the real figures are in — no code change needed.

### McDonald's (MCD)

- [ ] `fcf0` — operating cash flow − capex
- [ ] `sharesOutstanding`
- [ ] `cash`
- [ ] `debt`
- [ ] `currentPrice`
- [ ] `defaultGrowth` (judgement call — note your reasoning)
- [ ] `fiscalYear`, `snapshotDate`, all three `sources`

### Disney (DIS)

- [ ] `fcf0` — operating cash flow − capex
- [ ] `sharesOutstanding`
- [ ] `cash`
- [ ] `debt`
- [ ] `currentPrice`
- [ ] `defaultGrowth` (judgement call — note your reasoning)
- [ ] `fiscalYear`, `snapshotDate`, all three `sources`

### Coca-Cola (KO)

- [ ] `fcf0` — operating cash flow − capex
- [ ] `sharesOutstanding`
- [ ] `cash`
- [ ] `debt`
- [ ] `currentPrice`
- [ ] `defaultGrowth` (judgement call — note your reasoning)
- [ ] `fiscalYear`, `snapshotDate`, all three `sources`

### Verizon (VZ)

- [ ] `fcf0` — operating cash flow − capex
- [ ] `sharesOutstanding`
- [ ] `cash`
- [ ] `debt`
- [ ] `currentPrice`
- [ ] `defaultGrowth` (judgement call — note your reasoning)
- [ ] `fiscalYear`, `snapshotDate`, all three `sources`

> Verizon carries a lot of debt, which makes it a good teaching case: watch what
> subtracting it does to the equity value in "Under the hood".

### Home Depot (HD)

- [ ] `fcf0` — operating cash flow − capex
- [ ] `sharesOutstanding`
- [ ] `cash`
- [ ] `debt`
- [ ] `currentPrice`
- [ ] `defaultGrowth` (judgement call — note your reasoning)
- [ ] `fiscalYear`, `snapshotDate`, all three `sources`

### Starbucks (SBUX)

- [ ] `fcf0` — operating cash flow − capex
- [ ] `sharesOutstanding`
- [ ] `cash`
- [ ] `debt`
- [ ] `currentPrice`
- [ ] `defaultGrowth` (judgement call — note your reasoning)
- [ ] `fiscalYear`, `snapshotDate`, all three `sources`

---

## Recording your sources

Fill the table in as you go. The README points judges here, so it is also the
answer to "where did these numbers come from?"

| Company | Fiscal year | FCF source | Shares source | Price as of |
| --- | --- | --- | --- | --- |
| Apple | | | | |
| Microsoft | | | | |
| Costco | | | | |
| Nike | | | | |
| McDonald's | | | | |
| Disney | | | | |
| Coca-Cola | | | | |
| Verizon | | | | |
| Home Depot | | | | |
| Starbucks | | | | |

---

## What a finished entry looks like

```ts
{
  id: 'example',
  name: 'Example Corp',
  ticker: 'EXMP',
  sector: 'Consumer technology',
  whatTheyDo: 'Sells widgets and a subscription service for maintaining them.',
  fcf0: 12_400_000_000,
  sharesOutstanding: 1_850_000_000,
  cash: 9_100_000_000,
  debt: 14_300_000_000,
  currentPrice: 187.42,
  defaultGrowth: 0.06,
  fiscalYear: 'FY2025',
  snapshotDate: '2026-09-14',
  sources: {
    fcfSource: 'https://www.sec.gov/... FY2025 10-K, consolidated statements of cash flows',
    sharesSource: 'FY2025 10-K cover page',
    priceAsOf: '2026-09-14',
  },
},
```

Note there are no `// VERIFY` comments left on any line.

---

## When you're done

```bash
npm run check:data
```

You want:

```
  ✓ All 10 companies verified. Safe to deploy.
```

Then update the picker copy in `src/components/CompanyPicker.tsx` from the
interim wording to the honest permanent wording — the exact line to change is
listed in `TODO-ALEEM.md`.
