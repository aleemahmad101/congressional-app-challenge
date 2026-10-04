/**
 * The author's own voice, at the foot of the page. Written by Aleem —
 * keep the wording his.
 */
export function WhyIBuiltThis() {
  return (
    <aside className="colophon" aria-labelledby="colophon-title">
      <h2 id="colophon-title">Why I built this</h2>

      <p>
        I built ClearValue after helping my mother and grandmother understand investing. I realized
        that many people want to invest but don&apos;t understand concepts like valuation, cash
        flow, or even what owning a stock really means. After building DCF models myself, I saw how
        understanding a company&apos;s value—not just its stock price—can completely change how
        someone approaches long-term investing. ClearValue makes those concepts accessible through
        real financial data and interactive valuations, helping people make more informed decisions
        whether they&apos;re building a 401(k) or learning about investing for the first time.
      </p>

      <p className="signature">
        Built by a high school senior in San Ramon, California, for the 2026 Congressional App
        Challenge.
      </p>
    </aside>
  );
}
