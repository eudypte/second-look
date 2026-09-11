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
