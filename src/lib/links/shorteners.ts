export const SHORTENER_HOSTS = new Set([
  "bit.ly",
  "tinyurl.com",
  "is.gd",
  "t.co",
  "rb.gy",
  "cutt.ly",
  "t.ly",
  "ow.ly",
  "tiny.cc",
  "shorturl.at",
  "s.id",
]);

const TIMEOUT_MS = 3_000;

function isShortener(url: URL): boolean {
  return SHORTENER_HOSTS.has(url.hostname.toLowerCase().replace(/\.$/, ""));
}

async function fetchOneHop(url: URL): Promise<Response> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error("shortener timeout"));
    }, TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      fetch(url, { redirect: "manual", signal: controller.signal }),
      timedOut,
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

export interface ShortenerResult {
  finalUrl: URL | null;
  wasShortened: boolean;
  failed: boolean;
}

export async function unwrapShortLink(initialUrl: URL): Promise<ShortenerResult> {
  if (!isShortener(initialUrl)) {
    return { finalUrl: initialUrl, wasShortened: false, failed: false };
  }

  let current = initialUrl;
  for (let hop = 0; hop < 3; hop += 1) {
    try {
      const response = await fetchOneHop(current);
      if (response.status < 300 || response.status >= 400) {
        return { finalUrl: null, wasShortened: true, failed: true };
      }

      const location = response.headers.get("location");
      if (!location) {
        return { finalUrl: null, wasShortened: true, failed: true };
      }

      const next = new URL(location, current);
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        return { finalUrl: null, wasShortened: true, failed: true };
      }

      if (!isShortener(next)) {
        return { finalUrl: next, wasShortened: true, failed: false };
      }
      current = next;
    } catch {
      return { finalUrl: null, wasShortened: true, failed: true };
    }
  }

  return { finalUrl: null, wasShortened: true, failed: true };
}
