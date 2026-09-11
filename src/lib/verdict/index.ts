import type {
  LinkCheckResult,
  ModelReading,
  Tier,
  Verdict,
} from "../types";

export const NO_FLAGS_ADVICE =
  "That doesn't mean it's safe. If it asks for money or a code, call the company using the number on your card or on their official website.";

export const RED_LINK_ADVICE =
  "Don't tap the link or reply. If you're worried, contact the company using a phone number or website you already trust.";

export const RED_NO_LINK_ADVICE =
  "Don't reply or send money. If it claims to be someone you know, call them on the number you already have.";

export const AMBER_ADVICE =
  "Don't use the link in the message. Contact the company using a number or website you already know.";

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

function adviceFor(tier: Tier, hasLinks: boolean): string {
  if (tier === "red") {
    return hasLinks ? RED_LINK_ADVICE : RED_NO_LINK_ADVICE;
  }

  if (tier === "amber") {
    return AMBER_ADVICE;
  }

  return NO_FLAGS_ADVICE;
}

function guardedExplanation(explanation: string): string {
  const trimmed = explanation.trim();

  if (trimmed === "") {
    return MODEL_FAILURE_EXPLANATION;
  }

  const unquotedText = trimmed.replace(
    /"[^"]*"|'[^']*'|“[^”]*”|‘[^’]*’/g,
    "",
  );

  if (/\b(?:safe|legitimate|verified)\b/i.test(unquotedText)) {
    return CONTRADICTION_EXPLANATION;
  }

  return trimmed;
}

export function combineVerdict(
  linkResult: LinkCheckResult,
  modelReading: ModelReading,
): Verdict {
  const tier = higherTier(linkResult.floor, modelReading.tier);
  const hasLinks = linkResult.links.length > 0;

  return {
    tier,
    headline: headlineFor(tier, hasLinks),
    rows: linkResult.rows,
    explanation: guardedExplanation(modelReading.explanation),
    advice: adviceFor(tier, hasLinks),
  };
}
