import { Fragment } from "react";
import type { EvidenceRow, Tier, Verdict } from "@/lib/types";
import { TierShape } from "./tier-shape";

const SAFE_BROWSING_URL = "https://safebrowsing.google.com/";

const tierDetails: Record<Tier, { label: string; className: string }> = {
  red: { label: "Strong warning", className: "result-red" },
  amber: { label: "Use caution", className: "result-amber" },
  none: { label: "No red flags", className: "result-none" },
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

function wrapRiskTokens(text: string) {
  return text.split(/(\s+)/).map((token, index) =>
    /[\p{L}\p{N}-]\.[\p{L}\p{N}-]/u.test(token) ||
    /[\p{L}\p{N}]['’\p{L}\p{N}]*-[\p{L}\p{N}]/u.test(token) ? (
      <span className="unbroken-token" key={`${token}-${index}`}>
        {token}
      </span>
    ) : (
      token
    ),
  );
}

function highlightQuotes(text: string) {
  return text.split(/("[^"]*"|“[^”]*”)/).map((part, index) =>
    index % 2 === 1 ? (
      <mark className="quoted-phrase" key={index}>
        {wrapRiskTokens(part)}
      </mark>
    ) : (
      <Fragment key={index}>{wrapRiskTokens(part)}</Fragment>
    ),
  );
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
      <div className="sign">
        <div className="result-status">
          <TierShape tier={verdict.tier} use="sign" className="result-icon" />
          <span>{details.label}</span>
        </div>
        <h1 id="result-headline" tabIndex={-1}>
          {verdict.headline}
        </h1>
      </div>

      <div className="result-body">
        {verdict.rows.length > 0 ? (
          <div className="evidence-section">
            <h2>What stood out</h2>
            <ul className="evidence-list">
              {verdict.rows.map((row, index) => (
                <li key={`${row.signal}-${index}`}>
                  <TierShape
                    tier={row.tier}
                    use="row"
                    className={`evidence-marker evidence-marker-${row.tier}`}
                  />
                  <span>
                    {wrapRiskTokens(evidenceText(row))}
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
          <h2>Why we think that</h2>
          <p>{highlightQuotes(explanation)}</p>
        </div>
      </div>

      <div className="result-aside">
        {advice ? (
          <div className="advice">
            <h2>
              <svg className="advice-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 12h12M11 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              What to do
            </h2>
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
      </div>
    </section>
  );
}
