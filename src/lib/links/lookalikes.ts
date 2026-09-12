import { readFileSync } from "node:fs";
import { domainToUnicode } from "node:url";
import { join } from "node:path";

import { parse } from "tldts";

import { BRANDS, type Brand } from "./brands";

const popularDomains = new Set(
  readFileSync(join(process.cwd(), "src/lib/links/data/tranco-top-100000.txt"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#")),
);

function damerauLevenshtein(left: string, right: string): number {
  const distance = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  );

  for (let index = 0; index <= left.length; index += 1) distance[index][0] = index;
  for (let index = 0; index <= right.length; index += 1) distance[0][index] = index;

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      distance[leftIndex][rightIndex] = Math.min(
        distance[leftIndex - 1][rightIndex] + 1,
        distance[leftIndex][rightIndex - 1] + 1,
        distance[leftIndex - 1][rightIndex - 1] + cost,
      );

      if (
        leftIndex > 1 &&
        rightIndex > 1 &&
        left[leftIndex - 1] === right[rightIndex - 2] &&
        left[leftIndex - 2] === right[rightIndex - 1]
      ) {
        distance[leftIndex][rightIndex] = Math.min(
          distance[leftIndex][rightIndex],
          distance[leftIndex - 2][rightIndex - 2] + cost,
        );
      }
    }
  }

  return distance[left.length][right.length];
}

function normalizePart(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]/gu, "");
}

function isBrandPart(part: string, brand: Brand): boolean {
  const normalized = normalizePart(part);
  return brand.words.some((word) => {
    if (normalized === word) return true;
    if (brand.short) return false;
    if (damerauLevenshtein(normalized, word) <= 1) return true;
    return normalizePart(normalized.replaceAll("rn", "m")) === word;
  });
}

function ownsDomain(registrableDomain: string): boolean {
  return BRANDS.some((brand) => registrableDomain === brand.domain);
}

export interface HostAssessment {
  brand: Brand | null;
  freeHosting: boolean;
  registrableDomain: string | null;
  rdapDomain: string | null;
}

export function assessHost(hostname: string): HostAssessment {
  const asciiHost = hostname.toLowerCase().replace(/\.$/, "");
  const privateResult = parse(asciiHost, { allowPrivateDomains: true });
  const icannResult = parse(asciiHost, { allowPrivateDomains: false });
  const registrableDomain = privateResult.domain?.toLowerCase() ?? null;
  const rdapDomain = icannResult.domain?.toLowerCase() ?? null;
  const freeHosting = privateResult.isPrivate === true;

  if (
    !registrableDomain ||
    popularDomains.has(registrableDomain) ||
    ownsDomain(registrableDomain)
  ) {
    return { brand: null, freeHosting, registrableDomain, rdapDomain };
  }

  const hostForMatching = asciiHost.includes("xn--") ? domainToUnicode(asciiHost) : asciiHost;
  const parts = hostForMatching.split(/[.-]/u).filter(Boolean);
  const brand = BRANDS.find((candidate) => parts.some((part) => isBrandPart(part, candidate))) ?? null;

  return { brand, freeHosting, registrableDomain, rdapDomain };
}
