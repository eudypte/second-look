import type { Verdict } from "@/lib/types";

export const verdictFixtures = {
  red: {
    tier: "red",
    headline: "Don't tap that link. This looks like a scam.",
    rows: [
      {
        signal: "domain-age",
        tier: "red",
        text: "This website was set up 6 days ago.",
      },
      {
        signal: "brand-lookalike",
        tier: "red",
        text: "This isn't E-ZPass's website. E-ZPass uses e-zpassny.com.",
      },
      {
        signal: "model-pressure",
        tier: "red",
        text: 'The message pressures you with "final notice" and a late fee.',
      },
      {
        signal: "google-safe-browsing",
        tier: "red",
        text: "Google flags this site as likely dangerous. Advisory provided by Google.",
      },
    ],
    explanation:
      'The message tries to rush you by saying "final notice" and threatening a fee. That pressure is meant to make you tap before you have time to think.',
    advice:
      "Don't tap the link or reply. Check any toll balance through the website or phone number on a statement you already trust.",
  },
  amber: {
    tier: "amber",
    headline: "Be careful with this one.",
    rows: [
      {
        signal: "domain-age",
        tier: "amber",
        text: "This website was set up 48 days ago.",
      },
      {
        signal: "short-link",
        tier: "amber",
        text: "We couldn't see where this shortened link leads.",
      },
    ],
    explanation:
      'The message asks you to act "today" and tap a shortened link. That may be harmless, but it is worth checking another way.',
    advice:
      "Don't use the link in the message. Contact the company using a number or website you already know.",
  },
  none: {
    tier: "none",
    headline: "No red flags found.",
    rows: [],
    explanation:
      "We didn't find common scam pressure or a suspicious web address in this message.",
    advice: null,
  },
} satisfies Record<string, Verdict>;

export function getDevelopmentFixture(name: string | undefined) {
  if (!name || !(name in verdictFixtures)) {
    return undefined;
  }

  return verdictFixtures[name as keyof typeof verdictFixtures];
}
