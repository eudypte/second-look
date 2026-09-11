import { parse } from "protobufjs";

const ENDPOINT = "https://safebrowsing.googleapis.com/v5/urls:search";
const TIMEOUT_MS = 3_000;

const SEARCH_URLS_RESPONSE = parse(`
  syntax = "proto3";

  message ThreatUrl {
    string url = 1;
    repeated uint32 threat_types = 2;
  }

  message SearchUrlsResponse {
    repeated ThreatUrl threats = 1;
  }
`).root.lookupType("SearchUrlsResponse");

interface SearchResponse {
  threats?: { url?: string; threatTypes?: number[] }[];
}

export interface SafeBrowsingResult {
  dangerous: Set<string>;
  unavailable: boolean;
}

function threatCoversUrl(threat: string, candidate: string): boolean {
  if (threat === candidate) return true;

  try {
    const candidateUrl = new URL(candidate);
    const threatUrl = new URL(
      /^[a-z][a-z\d+.-]*:\/\//i.test(threat) ? threat : `${candidateUrl.protocol}//${threat}`,
    );
    const hostMatches =
      candidateUrl.hostname === threatUrl.hostname ||
      candidateUrl.hostname.endsWith(`.${threatUrl.hostname}`);
    return hostMatches && candidateUrl.pathname.startsWith(threatUrl.pathname);
  } catch {
    return false;
  }
}

export async function checkSafeBrowsing(urls: string[]): Promise<SafeBrowsingResult> {
  const key = process.env.SAFE_BROWSING_API_KEY;
  if (!key || urls.length === 0) {
    return { dangerous: new Set(), unavailable: urls.length > 0 };
  }

  const endpoint = new URL(ENDPOINT);
  endpoint.searchParams.set("key", key);
  for (const url of urls) endpoint.searchParams.append("urls", url);

  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error("Safe Browsing timeout"));
    }, TIMEOUT_MS);
  });

  try {
    const response = await Promise.race([
      fetch(endpoint, { signal: controller.signal }),
      timedOut,
    ]);
    if (!response.ok) return { dangerous: new Set(), unavailable: true };
    const body = SEARCH_URLS_RESPONSE.decode(
      new Uint8Array(await response.arrayBuffer()),
    ) as unknown as SearchResponse;
    const threats =
      body.threats?.flatMap((threat) =>
        threat.url && threat.threatTypes?.some((type) => type > 0) ? [threat.url] : [],
      ) ?? [];
    const dangerous = new Set(
      urls.filter((candidate) => threats.some((threat) => threatCoversUrl(threat, candidate))),
    );
    return { dangerous, unavailable: false };
  } catch {
    return { dangerous: new Set(), unavailable: true };
  } finally {
    clearTimeout(timeout);
  }
}
