import { isIP } from "node:net";

import type { EvidenceRow, LinkCheckResult, LinkReport, Tier } from "@/lib/types";

import { messageHasBrandOrMoney } from "./brands";
import { extractLinks } from "./extract";
import { assessHost } from "./lookalikes";
import { checkDomainAge } from "./rdap";
import { checkSafeBrowsing } from "./safe-browsing";
import { unwrapShortLink } from "./shorteners";

const TIER_RANK: Record<Tier, number> = { none: 0, amber: 1, red: 2 };

function highestTier(rows: EvidenceRow[]): Tier {
  return rows.reduce<Tier>(
    (highest, row) => (TIER_RANK[row.tier] > TIER_RANK[highest] ? row.tier : highest),
    "none",
  );
}

function row(signal: string, tier: Tier, text: string): EvidenceRow {
  return { signal, tier, text };
}

export async function checkLinks(text: string): Promise<LinkCheckResult> {
  const extracted = extractLinks(text);
  if (extracted.length === 0) return { links: [], floor: "none", rows: [] };

  const resolved = await Promise.all(
    extracted.map(async (link) => ({ link, shortener: await unwrapShortLink(link.url) })),
  );
  const riskContext = messageHasBrandOrMoney(text);

  const prepared = resolved.map(({ link, shortener }) => {
    const evidence: EvidenceRow[] = [];
    const originalHost = link.url.hostname.toLowerCase().replace(/\.$/, "");

    if (link.url.username.includes(".")) {
      evidence.push(
        row(
          "link.disguise",
          "red",
          `The part before the @ is a disguise. The link really goes to ${originalHost}.`,
        ),
      );
    }

    if (shortener.failed) {
      evidence.push(
        row("link.shortener-unresolved", "amber", "I couldn't see where this short link goes."),
      );
    }

    const effectiveUrl = shortener.finalUrl;
    const assessment = effectiveUrl ? assessHost(effectiveUrl.hostname) : null;

    if (effectiveUrl && isIP(effectiveUrl.hostname)) {
      evidence.push(
        row(
          "link.ip-address",
          "amber",
          "This link goes directly to an internet address instead of a named website.",
        ),
      );
    }

    if (assessment?.freeHosting) {
      evidence.push(
        row(
          "link.free-hosting",
          "amber",
          "This page is on a free website-building service, not the company's own site.",
        ),
      );
    }

    if (assessment?.brand) {
      evidence.push(
        row(
          "link.brand-lookalike",
          "red",
          `This isn't ${assessment.brand.name}'s website. ${assessment.brand.name} uses ${assessment.brand.domain}.`,
        ),
      );
    }

    return { link, shortener, evidence, effectiveUrl, assessment };
  });

  const effectiveUrls = prepared.flatMap(({ effectiveUrl }) =>
    effectiveUrl ? [effectiveUrl.toString()] : [],
  );
  const [ages, safeBrowsing] = await Promise.all([
    Promise.all(
      prepared.map(({ assessment, effectiveUrl }) =>
        assessment?.rdapDomain && effectiveUrl && !isIP(effectiveUrl.hostname)
          ? checkDomainAge(assessment.rdapDomain)
          : Promise.resolve(null),
      ),
    ),
    checkSafeBrowsing(effectiveUrls),
  ]);

  const links: LinkReport[] = prepared.map((item, index) => {
    const evidence = [...item.evidence];
    const age = ages[index];

    if (age?.status === "unknown") {
      evidence.push(
        row("link.domain-age-unknown", "none", "I couldn't check how old this website is."),
      );
    } else if (age?.status === "found" && age.ageDays <= 90) {
      const tier: Tier = age.ageDays < 30 && riskContext ? "red" : "amber";
      evidence.push(
        row(
          "link.domain-age",
          tier,
          `This website was set up ${age.ageDays} ${age.ageDays === 1 ? "day" : "days"} ago.`,
        ),
      );
    }

    if (item.effectiveUrl && safeBrowsing.dangerous.has(item.effectiveUrl.toString())) {
      evidence.push(
        row(
          "link.safe-browsing",
          "red",
          "Google flags this site as likely dangerous. Advisory provided by Google.",
        ),
      );
    } else if (item.effectiveUrl && safeBrowsing.unavailable) {
      evidence.push(
        row(
          "link.safe-browsing-unavailable",
          "none",
          "I couldn't check Google's list of dangerous websites.",
        ),
      );
    }

    return {
      raw: item.link.raw,
      host: item.link.url.hostname.toLowerCase().replace(/\.$/, ""),
      finalUrl: item.effectiveUrl?.toString() ?? null,
      evidence,
    };
  });

  const rows = links.flatMap((link) => link.evidence);

  return { links, floor: highestTier(rows), rows };
}
