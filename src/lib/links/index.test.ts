import { readFileSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkLinks } from "./index";
import { clearRdapCacheForTests } from "./rdap";

const NOW = new Date("2026-09-11T12:00:00Z");
const CAPTURED_SAFE_BROWSING_RESPONSE = readFileSync(
  new URL("./fixtures/safe-browsing-phishing.bin", import.meta.url),
);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function protobufResponse(threatUrl?: string): Response {
  if (!threatUrl) return new Response(new Uint8Array());

  const encodedUrl = new TextEncoder().encode(threatUrl);
  const threat = new Uint8Array([0x0a, encodedUrl.length, ...encodedUrl, 0x12, 0x01, 0x02]);
  return new Response(new Uint8Array([0x0a, threat.length, ...threat]));
}

function defaultFetch(input: string | URL | Request): Promise<Response> {
  const url = new URL(String(input));
  if (url.hostname === "safebrowsing.googleapis.com") {
    return Promise.resolve(protobufResponse());
  }
  if (url.pathname.includes("/domain/")) {
    return Promise.resolve(
      jsonResponse({ events: [{ eventAction: "registration", eventDate: "2000-01-01T00:00:00Z" }] }),
    );
  }
  throw new Error(`Unexpected request to ${url}`);
}

function signals(result: Awaited<ReturnType<typeof checkLinks>>): string[] {
  return result.rows.map((row) => row.signal);
}

beforeEach(() => {
  vi.useRealTimers();
  vi.setSystemTime(NOW);
  vi.stubEnv("SAFE_BROWSING_API_KEY", "test-key");
  vi.stubGlobal("fetch", vi.fn(defaultFetch));
  clearRdapCacheForTests();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("link extraction and parsing", () => {
  it("returns no evidence when the text has no links", async () => {
    await expect(checkLinks("Your package is waiting for you")).resolves.toEqual({
      links: [],
      floor: "none",
      rows: [],
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("parses a bare domain with the WHATWG URL parser", async () => {
    const result = await checkLinks("Visit example.com/help");
    expect(result.links[0]).toMatchObject({
      raw: "example.com/help",
      host: "example.com",
      finalUrl: "http://example.com/help",
    });
  });

  it("trims sentence punctuation around a link", async () => {
    const result = await checkLinks("Tap (https://example.com/path). now");
    expect(result.links[0].raw).toBe("https://example.com/path");
  });

  it("uses the host after an at-sign disguise", async () => {
    const result = await checkLinks("https://www.fedex.com@servicece.co/us");
    expect(result.floor).toBe("red");
    expect(result.links[0].host).toBe("servicece.co");
    expect(result.rows).toContainEqual({
      signal: "link.disguise",
      tier: "red",
      text: "The part before the @ is a disguise. The link really goes to servicece.co.",
    });
  });

  it("normalizes an internationalized host to punycode", async () => {
    const result = await checkLinks("http://pаypal.com");
    expect(result.links[0].host).toBe("xn--pypal-4ve.com");
    expect(signals(result)).toContain("link.brand-lookalike");
  });

  it("flags a bare IP address", async () => {
    const result = await checkLinks("http://192.0.2.10/login");
    expect(result.floor).toBe("amber");
    expect(signals(result)).toContain("link.ip-address");
  });
});

describe("brand and hosting rules", () => {
  it.each([
    ["usps-redeliver.top", "USPS"],
    ["usps.com-trackparcel.info", "USPS"],
    ["paypa1.com", "PayPal"],
    ["arnazon.com", "Amazon"],
    ["www.chase.com.secure-login.cc", "Chase"],
    ["ezpass-toll.help", "E-ZPass"],
    ["netfIix-billing.com", "Netflix"],
  ])("flags the pilot lookalike %s", async (domain, brand) => {
    const result = await checkLinks(`Pay your balance at ${domain}`);
    expect(result.floor).toBe("red");
    expect(result.rows).toContainEqual(
      expect.objectContaining({
        signal: "link.brand-lookalike",
        tier: "red",
        text: expect.stringContaining(`isn't ${brand}'s website`),
      }),
    );
  });

  it("flags a brand name on a free-hosting subdomain", async () => {
    const result = await checkLinks("usps-help.vercel.app");
    expect(result.floor).toBe("red");
    expect(signals(result)).toEqual(
      expect.arrayContaining(["link.free-hosting", "link.brand-lookalike"]),
    );
  });

  it.each(["shop.blogspot.com", "parcel.pages.dev"])(
    "flags the private suffix hosting service %s",
    async (domain) => {
      const result = await checkLinks(domain);
      expect(result.floor).toBe("amber");
      expect(signals(result)).toContain("link.free-hosting");
    },
  );

  it.each(["ups.com", "tools.usps.com", "amzn.to", "wellsfargoadvisors.com"])(
    "does not flag the legitimate or popular domain %s as a lookalike",
    async (domain) => {
      const result = await checkLinks(domain);
      expect(signals(result)).not.toContain("link.brand-lookalike");
    },
  );

  it("does not treat an unrelated punycode domain as a lookalike", async () => {
    const result = await checkLinks("https://xn--bcher-kva.example");
    expect(signals(result)).not.toContain("link.brand-lookalike");
  });
});

describe("short links", () => {
  it("unwraps one allowlisted hop without requesting the destination", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((input, init) => {
      const url = new URL(String(input));
      if (url.hostname === "bit.ly") {
        expect(init?.redirect).toBe("manual");
        return Promise.resolve(
          new Response(null, { status: 301, headers: { location: "https://example.com/landing" } }),
        );
      }
      return defaultFetch(input);
    });

    const result = await checkLinks("https://bit.ly/example");
    expect(result.links[0].finalUrl).toBe("https://example.com/landing");
    expect(fetchMock.mock.calls.some(([input]) => String(input) === "https://example.com/landing")).toBe(false);
  });

  it("follows another allowlisted shortener before stopping", async () => {
    const requestedShorteners: string[] = [];
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.hostname === "bit.ly") {
        requestedShorteners.push(url.hostname);
        return Promise.resolve(new Response(null, { status: 302, headers: { location: "https://t.co/x" } }));
      }
      if (url.hostname === "t.co") {
        requestedShorteners.push(url.hostname);
        return Promise.resolve(new Response(null, { status: 302, headers: { location: "https://example.com/" } }));
      }
      return defaultFetch(input);
    });

    const result = await checkLinks("bit.ly/x");
    expect(requestedShorteners).toEqual(["bit.ly", "t.co"]);
    expect(result.links[0].finalUrl).toBe("https://example.com/");
  });

  it("runs the lookalike checks against the revealed destination", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.hostname === "bit.ly") {
        return Promise.resolve(
          new Response(null, {
            status: 302,
            headers: { location: "https://usps-redeliver.top/pay" },
          }),
        );
      }
      return defaultFetch(input);
    });

    const result = await checkLinks("bit.ly/parcel");
    expect(result.floor).toBe("red");
    expect(signals(result)).toContain("link.brand-lookalike");
  });

  it("does not request a host outside the fixed shortener allowlist", async () => {
    await checkLinks("short.example/path");
    expect(
      vi.mocked(fetch).mock.calls.some(([, init]) => init?.redirect === "manual"),
    ).toBe(false);
  });

  it("sets amber when a shortener refuses to reveal its destination", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      if (new URL(String(input)).hostname === "rb.gy") return Promise.resolve(new Response(null, { status: 403 }));
      return defaultFetch(input);
    });
    const result = await checkLinks("rb.gy/missing");
    expect(result.floor).toBe("amber");
    expect(result.links[0].finalUrl).toBeNull();
    expect(signals(result)).toContain("link.shortener-unresolved");
  });

  it("stops after three allowlisted hops", async () => {
    const shortenerCalls: string[] = [];
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (["bit.ly", "t.co", "is.gd"].includes(url.hostname)) {
        shortenerCalls.push(url.hostname);
        const next = url.hostname === "bit.ly" ? "t.co" : url.hostname === "t.co" ? "is.gd" : "tiny.cc";
        return Promise.resolve(new Response(null, { status: 302, headers: { location: `https://${next}/x` } }));
      }
      return defaultFetch(input);
    });
    const result = await checkLinks("bit.ly/x");
    expect(shortenerCalls).toEqual(["bit.ly", "t.co", "is.gd"]);
    expect(signals(result)).toContain("link.shortener-unresolved");
  });
});

describe("RDAP and evidence floor", () => {
  it("sets red for a site under 30 days old when the text asks for money", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.pathname.includes("/domain/")) {
        return Promise.resolve(jsonResponse({ events: [{ eventAction: "registration", eventDate: "2026-09-07T12:00:00Z" }] }));
      }
      return defaultFetch(input);
    });
    const result = await checkLinks("Pay the fee at fresh-parcel-status.com");
    expect(result.floor).toBe("red");
    expect(result.rows).toContainEqual({
      signal: "link.domain-age",
      tier: "red",
      text: "This website was set up 4 days ago.",
    });
  });

  it("sets red for a new site when the message names a multi-word brand", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.pathname.includes("/domain/")) {
        return Promise.resolve(jsonResponse({ events: [{ eventAction: "registration", eventDate: "2026-09-07T12:00:00Z" }] }));
      }
      return defaultFetch(input);
    });
    const result = await checkLinks("Wells Fargo alert: account-notice-example.com");
    expect(result.rows.find((row) => row.signal === "link.domain-age")?.tier).toBe("red");
  });

  it("sets amber for a site under 30 days old without risky context", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.pathname.includes("/domain/")) {
        return Promise.resolve(jsonResponse({ events: [{ eventAction: "registration", eventDate: "2026-09-10T12:00:00Z" }] }));
      }
      return defaultFetch(input);
    });
    const result = await checkLinks("fresh-parcel-status.com");
    expect(result.floor).toBe("amber");
    expect(result.rows.find((row) => row.signal === "link.domain-age")?.text).toContain("1 day ago");
  });

  it("sets amber for a site from 30 through 90 days old", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.pathname.includes("/domain/")) {
        return Promise.resolve(jsonResponse({ events: [{ eventAction: "registration", eventDate: "2026-07-13T12:00:00Z" }] }));
      }
      return defaultFetch(input);
    });
    const result = await checkLinks("example.com");
    expect(result.floor).toBe("amber");
    expect(result.rows.find((row) => row.signal === "link.domain-age")?.text).toContain("60 days ago");
  });

  it("does not add age evidence for a site older than 90 days", async () => {
    const result = await checkLinks("example.com");
    expect(result.floor).toBe("none");
    expect(signals(result)).not.toContain("link.domain-age");
  });

  it("sets amber without fetching RDAP when the TLD has no registry", async () => {
    const result = await checkLinks("example.co");
    expect(result.floor).toBe("amber");
    expect(signals(result)).toContain("link.domain-age-unknown");
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes("/domain/"))).toBe(false);
  });

  it("sets amber when an RDAP lookup fails", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.pathname.includes("/domain/")) return Promise.resolve(jsonResponse({}, 503));
      return defaultFetch(input);
    });
    const result = await checkLinks("example.com");
    expect(result.floor).toBe("amber");
    expect(signals(result)).toContain("link.domain-age-unknown");
  });

  it("sets amber when an RDAP lookup times out", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.pathname.includes("/domain/")) return new Promise<Response>(() => undefined);
      return defaultFetch(input);
    });

    const pending = checkLinks("timeout-example.com");
    await vi.advanceTimersByTimeAsync(3_000);
    const result = await pending;
    expect(result.floor).toBe("amber");
    expect(signals(result)).toContain("link.domain-age-unknown");
  });
});

describe("Safe Browsing", () => {
  it("decodes a captured v5 response and uses Google's required wording", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.hostname === "safebrowsing.googleapis.com") {
        return Promise.resolve(new Response(CAPTURED_SAFE_BROWSING_RESPONSE));
      }
      return defaultFetch(input);
    });
    const result = await checkLinks("http://testsafebrowsing.appspot.com/s/phishing.html");
    expect(result.floor).toBe("red");
    expect(result.rows).toContainEqual({
      signal: "link.safe-browsing",
      tier: "red",
      text: "Google flags this site as likely dangerous. Advisory provided by Google.",
    });
  });

  it("sends all links in one v5 search", async () => {
    await checkLinks("example.com https://example.org/help");
    const calls = vi.mocked(fetch).mock.calls.filter(([input]) =>
      String(input).startsWith("https://safebrowsing.googleapis.com/"),
    );
    expect(calls).toHaveLength(1);
    const requestUrl = new URL(String(calls[0][0]));
    expect(requestUrl.searchParams.has("$alt")).toBe(false);
    expect(requestUrl.searchParams.getAll("urls")).toEqual([
      "http://example.com/",
      "https://example.org/help",
    ]);
  });

  it("does not let the popular-domain guard suppress a blocklist result", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.hostname === "safebrowsing.googleapis.com") {
        return Promise.resolve(protobufResponse("http://ups.com/"));
      }
      return defaultFetch(input);
    });
    const result = await checkLinks("ups.com");
    expect(result.floor).toBe("red");
    expect(signals(result)).toContain("link.safe-browsing");
  });

  it("does not lower another check when Safe Browsing fails", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = new URL(String(input));
      if (url.hostname === "safebrowsing.googleapis.com") return Promise.reject(new Error("offline"));
      return defaultFetch(input);
    });
    const result = await checkLinks("usps-redeliver.top");
    expect(result.floor).toBe("red");
    expect(signals(result)).toEqual(
      expect.arrayContaining(["link.brand-lookalike", "link.safe-browsing-unavailable"]),
    );
  });
});
