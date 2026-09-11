import type {
  LinkCheckResult,
  ModelReading,
  Tier,
  Verdict,
} from "../types";

export const NO_FLAGS_ADVICE =
  "That doesn't mean it's safe. If it asks for money or a code, call the company using the number on your card or on their official website.";

export const CONTRADICTION_EXPLANATION =
  "Claims inside the message cannot override the checks shown here.";

export const MODEL_FAILURE_EXPLANATION =
  "I couldn't read the message itself, so this result only uses the link checks.";

const tierRank: Record<Tier, number> = {
  none: 0,
  amber: 1,
  red: 2,
};

function higherTier(first: Tier, second: Tier): Tier {
  return tierRank[first] >= tierRank[second] ? first : second;
}

function headlineFor(tier: Tier, hasLinks: boolean): string {
  if (tier === "red") {
    const firstSentence = hasLinks
      ? "Don't tap that link."
      : "Don't reply to this.";

    return `${firstSentence} This looks like a scam.`;
  }

  if (tier === "amber") {
    return "Be careful with this one.";
  }

  return "No red flags found.";
}

function guardedExplanation(explanation: string): string {
  const trimmed = explanation.trim();

  if (trimmed === "") {
    return MODEL_FAILURE_EXPLANATION;
  }

  if (/\b(?:safe|legitimate|verified)\b/i.test(trimmed)) {
    return CONTRADICTION_EXPLANATION;
  }

  return trimmed;
}

export function combineVerdict(
  linkResult: LinkCheckResult,
  modelReading: ModelReading,
): Verdict {
  const tier = higherTier(linkResult.floor, modelReading.tier);

  return {
    tier,
    headline: headlineFor(tier, linkResult.links.length > 0),
    rows: linkResult.rows,
    explanation: guardedExplanation(modelReading.explanation),
    advice: tier === "none" ? NO_FLAGS_ADVICE : null,
  };
}
