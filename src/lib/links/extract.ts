import { parse } from "tldts";

export interface ExtractedLink {
  raw: string;
  url: URL;
}

const SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
const LEADING_WRAPPERS = /^[<([{\"'`]+/;
const TRAILING_WRAPPERS = /[>)}\]"'`,.!?;:]+$/;
const DOTTED_QUAD = /^\d{1,3}(?:\.\d{1,3}){3}$/;

function trimToken(token: string): string {
  return token.replace(LEADING_WRAPPERS, "").replace(TRAILING_WRAPPERS, "");
}

/**
 * A dotted token is only a link if it ends in a real public suffix. Without this,
 * run-on typing such as "store.like cereals" or an abbreviation such as "U.S.P.S"
 * becomes a host, and the message is then checked as though it carried a link.
 */
function isRealHost(hostname: string, rawHost: string, hasScheme: boolean): boolean {
  const parsed = parse(hostname);

  if (parsed.isIp) {
    // "7.5" expands to the address 7.0.0.5, but in a message it is a number.
    // Only an address the sender actually wrote out counts.
    return hasScheme || DOTTED_QUAD.test(rawHost);
  }

  return parsed.isIcann === true && parsed.domain !== null;
}

export function extractLinks(text: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];

  for (const token of text.split(/\s+/)) {
    if (!token.includes(".")) {
      continue;
    }

    const raw = trimToken(token);
    if (!raw.includes(".")) {
      continue;
    }

    try {
      const hasScheme = SCHEME.test(raw);
      const url = new URL(hasScheme ? raw : `http://${raw}`);
      if (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.hostname &&
        isRealHost(url.hostname, raw.split(/[/?#]/)[0], hasScheme)
      ) {
        links.push({ raw, url });
      }
    } catch {
      // A dot is only a candidate. The WHATWG parser decides whether it is a link.
    }
  }

  return links;
}
