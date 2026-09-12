import { describe, expect, it } from "vitest";

import type { LinkCheckResult, ModelReading, Tier } from "../types";
import {
  AMBER_ADVICE,
  combineVerdict,
  CONTRADICTION_EXPLANATION,
  MODEL_FAILURE_EXPLANATION,
  NO_FLAGS_ADVICE,
  RED_LINK_ADVICE,
  RED_NO_LINK_ADVICE,
} from "./index";

const tiers: Tier[] = ["none", "amber", "red"];
const tierRank: Record<Tier, number> = { none: 0, amber: 1, red: 2 };

function linkResult(floor: Tier, hasLinks = true): LinkCheckResult {
  return {
    links: hasLinks
      ? [
          {
            raw: "https://example.com",
            host: "example.com",
            finalUrl: "https://example.com/",
            evidence: [],
          },
        ]
      : [],
    floor,
    rows: [
      {
        signal: "test",
        tier: floor,
        text: "Existing evidence row.",
      },
    ],
  };
}

describe("combineVerdict", () => {
  it.each(
    tiers.flatMap((floor) => tiers.map((modelTier) => [floor, modelTier] as const)),
  )("combines a %s floor with a %s model tier", (floor, modelTier) => {
    const links = linkResult(floor);
    const reading: ModelReading = {
      tier: modelTier,
      explanation: "The message creates pressure.",
    };
    const expected = tierRank[floor] >= tierRank[modelTier] ? floor : modelTier;

    const verdict = combineVerdict(links, reading);

    expect(verdict.tier).toBe(expected);
    expect(verdict.rows).toBe(links.rows);
  });

  it("uses the reply headline for a red message without a link", () => {
    const verdict = combineVerdict(linkResult("none", false), {
      tier: "red",
      explanation: 'The request to "send money" matches a family impersonation scam.',
    });

    expect(verdict.headline).toBe(
      "Don't reply to this. This looks like a scam.",
    );
  });

  it.each(tiers)("guards contradictory model wording at %s", (tier) => {
    const verdict = combineVerdict(linkResult(tier), {
      tier,
      explanation: "The sender is legitimate and verified.",
    });

    expect(verdict.explanation).toBe(CONTRADICTION_EXPLANATION);
  });

  it.each(["safe", "legitimate", "verified"])(
    "guards the word %s",
    (contradiction) => {
      const verdict = combineVerdict(linkResult("amber"), {
        tier: "none",
        explanation: `This message is ${contradiction}.`,
      });

      expect(verdict.explanation).toBe(CONTRADICTION_EXPLANATION);
    },
  );

  it.each([
    'It claims to be "verified safe" - that is a trick.',
    "It claims to be ‘legitimate’ - that is a trick.",
  ])("keeps forbidden words when they only quote the message", (explanation) => {
    const verdict = combineVerdict(linkResult("red"), {
      tier: "red",
      explanation,
    });

    expect(verdict.explanation).toBe(explanation);
  });

  it("turns an empty model explanation into a failure message", () => {
    const verdict = combineVerdict(linkResult("none", false), {
      tier: "none",
      explanation: "",
    });

    expect(verdict.explanation).toBe(MODEL_FAILURE_EXPLANATION);
  });

  it("uses the fixed headline and advice templates", () => {
    expect(
      combineVerdict(linkResult("red"), {
        tier: "none",
        explanation: "The message creates pressure.",
      }),
    ).toMatchObject({
      headline: "Don't tap that link. This looks like a scam.",
      advice: RED_LINK_ADVICE,
    });
    expect(
      combineVerdict(linkResult("amber"), {
        tier: "none",
        explanation: "The message creates pressure.",
      }),
    ).toMatchObject({
      headline: "Be careful with this one.",
      advice: AMBER_ADVICE,
    });
    expect(
      combineVerdict(linkResult("none"), {
        tier: "none",
        explanation: "No pressure tactics stood out.",
      }),
    ).toMatchObject({
      headline: "No red flags found.",
      advice: NO_FLAGS_ADVICE,
    });
    expect(
      combineVerdict(linkResult("none", false), {
        tier: "red",
        explanation: "The message asks for money.",
      }),
    ).toMatchObject({
      headline: "Don't reply to this. This looks like a scam.",
      advice: RED_NO_LINK_ADVICE,
    });
  });
});
