export interface ExtractedLink {
  raw: string;
  url: URL;
}

const SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
const LEADING_WRAPPERS = /^[<([{\"'`]+/;
const TRAILING_WRAPPERS = /[>)}\]"'`,.!?;:]+$/;

function trimToken(token: string): string {
  return token.replace(LEADING_WRAPPERS, "").replace(TRAILING_WRAPPERS, "");
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
      const url = new URL(SCHEME.test(raw) ? raw : `http://${raw}`);
      if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname) {
        links.push({ raw, url });
      }
    } catch {
      // A dot is only a candidate. The WHATWG parser decides whether it is a link.
    }
  }

  return links;
}
