const ENDPOINT = "https://safebrowsing.googleapis.com/v5/urls:search";
const TIMEOUT_MS = 3_000;

interface SearchResponse {
  threats?: { url?: string; threatTypes?: string[] }[];
}

export interface SafeBrowsingResult {
  dangerous: Set<string>;
  unavailable: boolean;
}

function threatCoversUrl(threat: string, candidate: string): boolean {
  if (threat === candidate) return true;

  try {
    const threatUrl = new URL(threat);
    const candidateUrl = new URL(candidate);
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
  endpoint.searchParams.set("$alt", "json");
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
    const body = (await response.json()) as SearchResponse;
    const threats = body.threats?.flatMap((threat) => (threat.url ? [threat.url] : [])) ?? [];
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
