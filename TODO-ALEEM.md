# TODO — Aleem only

Everything in this file needs content, judgement, or an account only you have.
Ordered by deadline pressure. Tick as you go.

**Submission: 21 October 2026** (assemble on the portal then — do not wait for
the 26th).

---

## 1. Load and verify the company data — BLOCKING ⚠

The app now offers 63 companies. Their reported figures come from SEC EDGAR via
a script, so you no longer type them in one by one. This cloud session could not
reach sec.gov (network policy), so **you must run it once on your machine**:

```bash
SEC_USER_AGENT="Aleem Ahmad your@email.com" npm run data:fetch
npm run check:data
```

- [ ] Run the fetch. Until you do, only the original 10 companies can be valued;
      the rest honestly show "Figures needed".
- [ ] Add a **share price** (with date) for each company you want compared
      against the market — `hand.currentPrice` in `src/data/catalog.ts`.
- [ ] Replace the nine `SAMPLE DATA` prices and delete their `// VERIFY` markers.
- [ ] **Apple:** your hand-entered `fcf0` is $136.68B, but its sources line
      cites the FY2025 10-K. Check it against operating cash flow minus capex in
      that 10-K; once the SEC fetch runs, the filing figure is used instead.
- [ ] Spot-check 3–4 companies' figures against their linked 10-K.
- [ ] Done when `check:data` prints `✓ No sample data on screen`.

Details: **[`data/VERIFICATION.md`](data/VERIFICATION.md)**.

---

## 2. Write "Why I built this" — ✅ done

Your final text is in `src/components/WhyIBuiltThis.tsx`.

---

## 3. Deploy it

### 3a. Turn on the preview link (do this first — 2 minutes)

A build is already published to the `gh-pages` branch so you can share it while
you work. It carries the **sample data**, clearly labelled, and a `noindex` tag
so it stays out of Google. Two settings and the link goes live:

- [ ] **Make the repo public** — Settings → General → Danger Zone → Change
      visibility. On a free account, GitHub Pages only serves public repos, so
      this is required.
- [ ] **Enable Pages** — Settings → Pages → Source: *Deploy from a branch* →
      branch **`gh-pages`**, folder **`/ (root)`** → Save.
- [ ] Wait ~1 minute, then open
      `https://aleemahmad101.github.io/congressional-app-challenge/`

**Share that link for feedback only.** Friends, family, anyone who'll tell you
how it feels to use. **Do not send it to judges or teachers as your
submission** — the numbers in it are still invented.

### 3b. Remove the noindex — BEFORE SUBMISSION ⚠

Once `check:data` passes and the real figures are in:

- [ ] Delete the `<meta name="robots" content="noindex, nofollow" />` tag in
      `index.html`
- [ ] Delete `public/robots.txt`
- [ ] Redeploy with `npm run deploy`

If you skip this, the site stays invisible to search engines. It won't break
the judges' link, but it's not what you want long term.

### 3c. The real deploy

- [ ] Make the repo **public** (Settings → General → Danger Zone).
- [ ] Enable GitHub Pages: Settings → Pages → Source: **Deploy from a branch** →
      branch `gh-pages`, folder `/ (root)`. The branch appears after your first
      deploy.
- [ ] Run the deploy:

```bash
npm run deploy
```

This runs `check:data` first and refuses to build if the data is unverified.

- [ ] Confirm the live URL loads:
      `https://aleemahmad101.github.io/congressional-app-challenge/`
- [ ] **If that URL is different**, update the four absolute `og:` /
      `twitter:` URLs in `index.html`. Relative paths do not work for link
      previews.
- [ ] Open it on **your own phone** and on **a friend's phone**.
- [ ] Paste the link into iMessage or Discord and check the preview card shows
      the ClearValue image, not a blank box.
- [ ] Run Lighthouse on the deployed URL (Chrome DevTools → Lighthouse). Target
      ≥ 95 on all four categories.
- [ ] Put the URL in the CAC submission.

---

## 4. Record the demo video

**The video is most of the grade.** Record it *after* items 1–3 are done, so
the data is real and the URL works on screen.

Target **2:00–2:30**. Screen recording plus your voice; face optional. Quiet
room, phone stand or OBS, 1080p. **Script it, do at least 3 takes, cut dead
air.**

### 0:00–0:20 — the problem, personally

> "Most people in my community own stocks through retirement accounts. Almost
> nobody can say what a company is actually worth — that knowledge sits behind
> expensive terminals and finance degrees. I'm a high school senior who taught
> myself valuation, and I built a free tool so anyone can do it."

Say it in your own words. This is the single most important 20 seconds.

### 0:20–0:50 — one clean walkthrough

Pick the company that opens in the neutral band (currently Nike — check which
one leads the suggestions after your data lands). Company card → the verdict
reads out → point at the plain-English sentence.

### 0:50–1:30 — the River of Cash and one slider

Explain ghost vs. solid bars in **one** sentence. Drag the discount rate and let
the shrink animation carry it — don't talk over it. Then the implied-growth
line: *"the price tells you what the market believes — the app measures your
disagreement."*

### 1:30–1:50 — Explain-everything mode

Tap two glossary terms. *"The app assumes zero finance background."*

### 1:50–2:15 — craft and close

One line on tests / accessibility / no tracking / free forever. Live URL on
screen. Why it matters for the district.

- [ ] Scripted
- [ ] Recorded (3+ takes)
- [ ] Edited
- [ ] Uploaded, link in submission

---

## 5. Final QA on the deployed build

Do these on the **live URL**, not localhost.

- [ ] Keyboard only, full flow — tab through picker, sliders, chart bars,
      disclosures. Focus ring visible at every stop.
- [ ] Screen reader: verdict announces once when a slider moves, not on every
      animation frame.
- [ ] `prefers-reduced-motion` on — animation stops, nothing breaks.
- [ ] 375px width — chart switches to the compact layout, no sideways scroll.
- [ ] Print preview — one clean page, collapsed sections expanded, assumptions
      shown as text.
- [ ] `npm test` and `npm run check:data` both pass.
- [ ] Tag the release: `git tag cac-submission && git push --tags`

---

## Calendar

| When | What |
| --- | --- |
| This week | Start data entry (item 1) |
| By 10 Oct | Deployed with verified data; "Why I built this" written |
| 11–15 Oct | QA sweep, **freeze features** |
| 16–20 Oct | Video scripted, recorded, edited |
| **21 Oct** | **Full submission assembled on the CAC portal** |

---

## Things deliberately NOT on this list

Don't add more features. The judged strength of this app is that it is
polished and honest. Between now and October, fixing the data, deploying, and making a
good video is worth more than anything you could build.
