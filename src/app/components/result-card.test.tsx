import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { verdictFixtures } from "../fixtures";
import { ResultCard } from "./result-card";

describe("ResultCard", () => {
  it.each([
    ["red", "Strong warning", "This looks like a scam"],
    ["amber", "Use caution", "Be careful with this one"],
    ["none", "No red flags", "No red flags found"],
  ] as const)(
    "shows a text label and headline for the %s tier",
    (tier, label, headline) => {
      const markup = renderToStaticMarkup(
        <ResultCard verdict={verdictFixtures[tier]} />,
      );

      expect(markup).toContain(label);
      expect(markup).toContain(headline);
      expect(markup).toContain("Check another message");
    },
  );

  it("links the required Google attribution", () => {
    const markup = renderToStaticMarkup(
      <ResultCard verdict={verdictFixtures.red} />,
    );

    expect(markup).toContain('href="https://safebrowsing.google.com/"');
    expect(markup).toContain("Advisory provided by Google");
  });

  it("keeps web addresses and hyphenated names together", () => {
    const markup = renderToStaticMarkup(
      <ResultCard verdict={verdictFixtures.red} />,
    );

    expect(markup).toContain(
      '<span class="unbroken-token">e-zpassny.com.</span>',
    );
    expect(markup).toContain('<span class="unbroken-token">E-ZPass&#x27;s</span>');
  });

  it("styles informational evidence neutrally", () => {
    const markup = renderToStaticMarkup(
      <ResultCard
        verdict={{
          ...verdictFixtures.red,
          rows: [
            {
              signal: "domain-age-unknown",
              tier: "none",
              text: "I couldn't check how old this website is.",
            },
          ],
        }}
      />,
    );

    expect(markup).toContain(
      'class="evidence-marker evidence-marker-none" aria-hidden="true">i</span>',
    );
  });

  it("adds the required caution after a no-flags result", () => {
    const markup = renderToStaticMarkup(
      <ResultCard verdict={verdictFixtures.none} />,
    );

    expect(markup).toContain("That doesn&#x27;t mean it&#x27;s safe.");
    expect(markup).toContain("number on your card");
  });

  it("shows a plain explanation while the checker is still a stub", () => {
    const markup = renderToStaticMarkup(
      <ResultCard verdict={{ ...verdictFixtures.none, explanation: "" }} />,
    );

    expect(markup).toContain("We didn&#x27;t find common scam pressure");
  });
});
