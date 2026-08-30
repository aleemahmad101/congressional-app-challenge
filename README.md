# ClearValue

**What is a company actually worth?** ClearValue runs a real discounted cash flow
valuation — the same model used across professional finance — and explains every
step in plain English. Pick a company, drag two sliders, and watch abstract
finance become something you can see.

Congressional App Challenge 2026 submission.

---

## For judges

Most Americans own stock through a retirement account and have never seen how a
company's worth is actually calculated. That knowledge sits behind expensive
terminals and finance degrees.

ClearValue takes the standard method professionals use — projecting a company's
future cash and discounting it back to what it is worth today — and makes it
visible and playable. The centrepiece, **the River of Cash**, draws every bar
twice: a faint outline for the cash as it arrives, and a solid bar for what that
cash is worth today. The gap between them *is* the concept of discounting. Drag
the discount-rate slider and watch the solid bars shrink in real time.

Turn on **Learn Mode** and every finance term becomes a tappable definition
written for a complete beginner, plus a three-step guided tour of the chart.

No accounts, no tracking, no server. Everything runs in the browser.

**This is an educational tool, not investment advice.**

---

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open the URL it prints (http://localhost:5174).

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm test` | Runs the unit tests once |
| `npm run test:watch` | Re-runs tests as you edit |
| `npm run build` | Type-checks, then writes a static site to `dist/` |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run lint` | Lints the source |

### Production build

```bash
npm run build
```

The output in `dist/` is a plain static site — HTML, one CSS file, one JS file,
no backend. It can be dropped onto GitHub Pages, Netlify, or any static host.
`vite.config.ts` sets `base: './'` so the build works from a project subpath
(e.g. `username.github.io/clearvalue/`) as well as from a domain root.

---

## ⚠ Before submitting: verify the company data

**Every financial figure in `src/data/companies.ts` is a placeholder**, and each
one carries a `// VERIFY` comment. Replace them with the real figures from each
company's most recent 10-K, then delete the marker:

```bash
grep -rn "VERIFY" src/
```

For each company you need free cash flow (cash from operating activities minus
capital expenditures), shares outstanding, cash and equivalents, total debt, and
a share price. Update `SNAPSHOT_DATE` at the top of the file to the date you
took them — it is shown in the footer disclaimer.

> The data lives in a `.ts` file rather than `companies.json` for one reason:
> JSON cannot hold the per-number `// VERIFY` markers this checking pass depends
> on. It is still plain static data — no logic, no network calls.

No real company logos are used anywhere in the app, deliberately. Cards render a
generated two-letter monogram from the ticker.

---

## How the model works

All the maths lives in [`src/lib/dcf.ts`](src/lib/dcf.ts) as pure functions with
no React and no I/O, so it can be tested directly.

1. Project free cash flow for years 1–5: `FCF_t = fcf0 × (1 + g)^t`
2. Discount each year back to today: `PV_t = FCF_t / (1 + r)^t`
3. Terminal value at year 5 (Gordon growth): `TV = FCF_5 × (1 + gT) / (r − gT)`,
   discounted by `1 / (1 + r)^5`
4. Enterprise value = the five present values + the discounted terminal value
5. Equity value = enterprise value + cash − debt
6. **Fair value per share = equity value ÷ shares outstanding**
7. Upside = (fair value − market price) ÷ market price

A guardrail keeps terminal growth at least 1.5 points below the discount rate.
Below that the Gordon growth denominator collapses and fair value runs off to
infinity — mathematically valid, economically nonsense. When the guardrail
fires, the UI says so rather than quietly changing the answer.

### About the chart's scale

The terminal value is typically **sixteen times taller** than any single
projected year, so it cannot share a linear axis with them without squashing
the year bars flat. ClearValue does not solve this with a hidden second axis.
The five year bars set the scale; the terminal bar is drawn to that same scale
divided by a round number, and **the chart states the divisor on screen**
("drawn at 1/10 scale so it fits"). Tooltips always report real dollars.

That the last bar dwarfs the others is not a drawing problem — it is the single
most important thing a discounted cash flow model has to teach. Most of a
company's value is the cash it makes after the forecast ends.

---

## Tests

```bash
npm test
```

63 tests covering the parts that have to be right:

- **`dcf.test.ts`** — the model. A zero-growth case collapses to a perpetuity
  (`EV = FCF / r`), which makes the expected numbers checkable by hand. Also the
  terminal-spread guardrail, negative equity from heavy debt, viability checks,
  verdict banding, the sensitivity grid, and every formatting helper.
- **`river.test.ts`** — chart geometry. Asserts that across the *entire* slider
  range the terminal bar stays inside the plot yet remains taller than every
  year bar, that touch targets never overlap, and that the compact mobile layout
  clears 44px targets while reaching the same numbers as the wide one.
- **`manual.test.ts`** — hand-entered input validation.

---

## What's in here

```
src/
  lib/
    dcf.ts          The valuation model. Pure functions, no React.
    river.ts        Chart geometry, including the scale-break logic.
    manual.ts       Validation for hand-entered figures.
  data/
    companies.ts    20 bundled companies (placeholder values — see above).
    glossary.ts     Learn Mode definitions.
  components/       One component per piece of the page.
  hooks.ts          Media queries, number tweening, print handling.
  styles.css        The whole design system in one file.
```

No component library and no CSS framework — the look is hand-built on purpose.
State is `useState` only; there is no router, no store, and no backend.

---

## Design and accessibility notes

- One theme, deliberately. A dark mode would double the QA surface for no gain
  to a judge watching a two-minute demo.
- Type: **Fraunces** for display figures, **Public Sans** for the interface —
  the U.S. government's own open-source typeface, a quiet nod for a
  congressional competition — and **Spline Sans Mono** with tabular figures for
  every number, so digits never shift as values change.
- Every control is keyboard operable with a visible focus ring, including the
  chart bars. The verdict is an `aria-live` region, so screen readers announce
  the recalculation when a slider moves.
- All animation is under 200ms and stops entirely under
  `prefers-reduced-motion`.
- A `@media print` pass gives a judge who prints the page a clean one-pager:
  controls disappear, collapsed sections expand, and the assumptions behind the
  headline figure are restated as text.
- Tested down to 375px, where the chart switches to a squarer layout rather
  than shrinking its labels into illegibility.
