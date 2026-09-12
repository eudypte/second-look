import bootstrap from "./data/dns.json";

const TIMEOUT_MS = 3_000;
const CACHE_MS = 24 * 60 * 60 * 1_000;

interface Bootstrap {
  services: [string[], string[]][];
}

interface RdapResponse {
  events?: { eventAction?: string; eventDate?: string }[];
}

export type RdapResult =
  | { status: "found"; ageDays: number }
  | { status: "unknown" };

interface CacheEntry {
  expiresAt: number;
  value: RdapResult;
}

const cache = new Map<string, CacheEntry>();
const registryByTld = new Map<string, string>();

for (const [tlds, urls] of (bootstrap as unknown as Bootstrap).services) {
  const registry = urls.find((url) => url.startsWith("https://")) ?? urls[0];
  if (!registry) continue;
  for (const tld of tlds) registryByTld.set(tld.toLowerCase(), registry);
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error("RDAP timeout"));
    }, TIMEOUT_MS);
  });

  try {
    return await Promise.race([fetch(url, { signal: controller.signal }), timedOut]);
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkDomainAge(domain: string): Promise<RdapResult> {
  const now = Date.now();
  const cached = cache.get(domain);
  if (cached && cached.expiresAt > now) return cached.value;

  const tld = domain.split(".").at(-1);
  const registry = tld ? registryByTld.get(tld) : undefined;
  let value: RdapResult = { status: "unknown" };

  if (registry) {
    try {
      const base = registry.endsWith("/") ? registry : `${registry}/`;
      const response = await fetchWithTimeout(`${base}domain/${encodeURIComponent(domain)}`);
      if (response.ok) {
        const body = (await response.json()) as RdapResponse;
        const registration = body.events?.find(
          (event) => event.eventAction?.toLowerCase() === "registration",
        );
        const timestamp = registration?.eventDate ? Date.parse(registration.eventDate) : Number.NaN;
        if (Number.isFinite(timestamp)) {
          value = { status: "found", ageDays: Math.max(0, Math.floor((now - timestamp) / 86_400_000)) };
        }
      }
    } catch {
      value = { status: "unknown" };
    }
  }

  cache.set(domain, { value, expiresAt: now + CACHE_MS });
  return value;
}

export function clearRdapCacheForTests(): void {
  cache.clear();
}
