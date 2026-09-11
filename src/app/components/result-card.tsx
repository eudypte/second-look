import type { EvidenceRow, Tier, Verdict } from "@/lib/types";

const SAFE_BROWSING_URL = "https://safebrowsing.google.com/";

const tierDetails: Record<
  Tier,
  { label: string; symbol: string; className: string }
> = {
  red: { label: "Strong warning", symbol: "!", className: "result-red" },
  amber: { label: "Use caution", symbol: "!", className: "result-amber" },
  none: { label: "No red flags", symbol: "i", className: "result-none" },
};

const noFlagsAdvice =
  "That doesn't mean it's safe. If it asks for money or a code, call the company using the number on your card or on their official website.";

const noFlagsExplanation =
  "We didn't find common scam pressure or a suspicious web address in this message.";

interface ResultCardProps {
  verdict: Verdict;
  onReset?: () => void;
}

function isSafeBrowsingRow(row: EvidenceRow) {
  return (
    /safe.?browsing|google/i.test(row.signal) ||
    /google flags/i.test(row.text)
  );
}

function evidenceText(row: EvidenceRow) {
  return row.text
    .replace(/\s*Advisory provided by Google\.?\s*$/i, "")
    .trim();
}

export function ResultCard({ verdict, onReset }: ResultCardProps) {
  const details = tierDetails[verdict.tier];
  const advice =
    verdict.advice ?? (verdict.tier === "none" ? noFlagsAdvice : null);
  const explanation =
    verdict.explanation.trim() ||
    (verdict.tier === "none"
      ? noFlagsExplanation
      : "The checks above are why this message needs extra care.");

  return (
    <section
      className={`result-card ${details.className}`}
      aria-labelledby="result-headline"
      aria-live="polite"
    >
      <div className="result-status">
        <span className="result-icon" aria-hidden="true">
          {details.symbol}
        </span>
        <span>{details.label}</span>
      </div>

      <h2 id="result-headline">{verdict.headline}</h2>

      {verdict.rows.length > 0 ? (
        <div className="evidence-section">
          <h3>What stood out</h3>
          <ul className="evidence-list">
            {verdict.rows.map((row, index) => (
              <li key={`${row.signal}-${index}`}>
                <span className="evidence-marker" aria-hidden="true">
                  {row.tier === "red" ? "!" : "•"}
                </span>
                <span>
                  {evidenceText(row)}
                  {isSafeBrowsingRow(row) ? (
                    <>
                      {" "}
                      <a
                        href={SAFE_BROWSING_URL}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Advisory provided by Google
                      </a>
                      .
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="explanation">
        <h3>Why we think that</h3>
        <p>{explanation}</p>
      </div>

      {advice ? (
        <div className="advice">
          <strong>What to do</strong>
          <p>{advice}</p>
        </div>
      ) : null}

      <button
        className="button button-primary result-reset"
        type="button"
        onClick={onReset}
      >
        Check another message
      </button>
    </section>
  );
}
