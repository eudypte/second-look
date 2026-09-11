import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const EVAL_DIR = path.dirname(fileURLToPath(import.meta.url));

const SOURCES = {
  imc: {
    url: "https://raw.githubusercontent.com/reportsmishing/Smishing-Dataset-IMC25/a6175560b57387199871e51fbef6bc523d2516b4/dataset/final_dataset_output.csv",
    sha256: "1bbd1e9e82c3ea023112207b80da268a5c4a07d2353c2b0898360ab037fa9a64",
  },
  uci: {
    url: "https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip",
    sha256: "1587ea43e58e82b14ff1f5425c88e17f8496bfcdb67a583dbff9eefaf9963ce3",
  },
  tranco: {
    url: "https://tranco-list.eu/download/Y8YQG/1000000",
    sha256: "1c94b0deeee0635c73b96c11352695e9756f3c818166f9e7cd5b5a95a35d14d3",
  },
  openPhish: {
    url: "https://raw.githubusercontent.com/openphish/public_feed/c6b8f3931575db00b6c99f29bfa8148786916f85/feed.txt",
    sha256: "24ca3ee56050a9436fa324701e9223c059c7c71bb9eafc9d37cf0b05932ed9cb",
  },
};

const SCAM_SEED = "second-look-imc-2025-v1";
const UCI_SEED = "second-look-uci-ham-v1";
const TRANCO_SEED = "second-look-tranco-Y8YQG-v1";
const OPENPHISH_SEED = "second-look-openphish-2026-09-11-v1";

const SCAM_QUOTAS = {
  delivery: 34,
  government: 34,
  banking: 33,
  telecom: 33,
  "wrong number": 33,
  "hey mum/dad": 33,
};

const US_BRANDS = [
  "amazon",
  "american express",
  "apple",
  "at&t",
  "bank of america",
  "capital one",
  "chase",
  "citibank",
  "citi",
  "discover",
  "fedex",
  "irs",
  "netflix",
  "paypal",
  "spectrum",
  "t-mobile",
  "target",
  "ups",
  "usps",
  "venmo",
  "verizon",
  "walmart",
  "wells fargo",
  "xfinity",
];

const BRAND_LINKS = [
  "https://tools.usps.com/go/TrackConfirmAction_input",
  "https://www.usps.com/manage/informed-delivery.htm",
  "https://www.usps.com/help/missing-mail.htm",
  "https://www.ups.com/track",
  "https://www.ups.com/us/en/support/tracking-support",
  "https://www.fedex.com/en-us/tracking.html",
  "https://www.fedex.com/en-us/delivery-manager.html",
  "https://www.dhl.com/us-en/home/tracking.html",
  "https://www.amazon.com/gp/css/order-history",
  "https://www.amazon.com/hz/contact-us",
  "https://www.walmart.com/orders",
  "https://www.target.com/orders",
  "https://www.bestbuy.com/profile/ss/orders",
  "https://www.ebay.com/mye/myebay/purchase",
  "https://www.etsy.com/your/purchases",
  "https://www.paypal.com/myaccount/activities",
  "https://account.venmo.com/",
  "https://secure.chase.com/web/auth/dashboard",
  "https://secure.bankofamerica.com/login/sign-in/signOnV2Screen.go",
  "https://connect.secure.wellsfargo.com/auth/login/present",
  "https://online.citi.com/US/login.do",
  "https://verified.capitalone.com/auth/signin",
  "https://onlinebanking.usbank.com/auth/login/",
  "https://www.pnc.com/en/personal-banking.html",
  "https://onlinebanking.tdbank.com/",
  "https://www.truist.com/login",
  "https://digitalbanking.navyfederal.org/signin/",
  "https://www.americanexpress.com/en-us/account/login/",
  "https://portal.discover.com/customersvcs/universalLogin/ac_main",
  "https://www.verizon.com/signin/",
  "https://account.t-mobile.com/signin/v2/",
  "https://www.att.com/acctmgmt/login",
  "https://login.xfinity.com/login",
  "https://www.spectrum.net/login",
  "https://sa.www4.irs.gov/wmr/",
  "https://www.irs.gov/payments",
  "https://secure.ssa.gov/RIL/SiView.action",
  "https://www.medicare.gov/account/login",
  "https://www.usa.gov/scams-and-fraud",
  "https://www.dmv.ca.gov/portal/mydmv/",
  "https://myaccount.google.com/security",
  "https://account.apple.com/",
  "https://account.microsoft.com/security",
  "https://www.dropbox.com/account/security",
  "https://www.facebook.com/settings",
  "https://www.instagram.com/accounts/edit/",
  "https://www.cvs.com/account/login/",
  "https://www.walgreens.com/login.jsp",
  "https://healthy.kaiserpermanente.org/front-door",
  "https://myquest.questdiagnostics.com/web/home",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function download(source, name) {
  const response = await fetch(source.url, {
    headers: { "user-agent": "second-look-evaluation-preparer/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Could not download ${name}: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const actualHash = sha256(buffer);
  assert(
    actualHash === source.sha256,
    `${name} changed: expected SHA-256 ${source.sha256}, received ${actualHash}`,
  );
  return buffer;
}

function parseCsv(input) {
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n") {
      record.push(field.replace(/\r$/, ""));
      records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || record.length) {
    record.push(field.replace(/\r$/, ""));
    records.push(record);
  }
  assert(!quoted, "CSV ended inside a quoted field");
  return records;
}

function csvObjects(input) {
  const [headers, ...rows] = parseCsv(input);
  return rows
    .filter((row) => row.some(Boolean))
    .map((row, index) => ({
      ...Object.fromEntries(headers.map((header, column) => [header, row[column] ?? ""])),
      sourceRow: index + 2,
    }));
}

function unzipEntry(zip, wantedName) {
  let offset = 0;
  while (offset + 30 <= zip.length && zip.readUInt32LE(offset) === 0x04034b50) {
    const flags = zip.readUInt16LE(offset + 6);
    const method = zip.readUInt16LE(offset + 8);
    const compressedSize = zip.readUInt32LE(offset + 18);
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    assert((flags & 0x08) === 0, "ZIP data descriptors are not supported");
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = zip.subarray(nameStart, nameStart + nameLength).toString("utf8");
    const compressed = zip.subarray(dataStart, dataStart + compressedSize);
    if (name === wantedName) {
      if (method === 0) return compressed;
      if (method === 8) return inflateRawSync(compressed);
      throw new Error(`Unsupported ZIP compression method ${method}`);
    }
    offset = dataStart + compressedSize;
  }
  throw new Error(`ZIP entry not found: ${wantedName}`);
}

function makeRandom(seed) {
  let state = 2166136261;
  for (const character of seed) {
    state ^= character.codePointAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, seed) {
  const output = [...items];
  const random = makeRandom(seed);
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function normalizedText(text) {
  return text.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function hasPreferredUsBrand(row) {
  const searchable = `${row.named_entity} ${row.text}`.toLocaleLowerCase("en-US");
  return US_BRANDS.some((brand) => searchable.includes(brand));
}

function orderedScamCandidates(rows, type) {
  const shuffled = shuffle(
    rows.filter(
      (row) => row.language === "English" && row.scam_type === type && row.text.trim(),
    ),
    `${SCAM_SEED}:${type}`,
  );
  const seen = new Set();
  const unique = shuffled.filter((row) => {
    const key = normalizedText(row.text);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [
    ...unique.filter(hasPreferredUsBrand),
    ...unique.filter((row) => !hasPreferredUsBrand(row)),
  ];
}

function selectScams(rows, review) {
  assert(review.seed === SCAM_SEED, "scam-review.json has the wrong seed");
  assert(
    JSON.stringify(review.quotas) === JSON.stringify(SCAM_QUOTAS),
    "scam-review.json has the wrong quotas",
  );
  const rejected = new Set(review.rejected.map(({ sourceRow }) => sourceRow));
  const selected = {};
  for (const [type, quota] of Object.entries(SCAM_QUOTAS)) {
    selected[type] = orderedScamCandidates(rows, type)
      .filter((row) => !rejected.has(row.sourceRow))
      .slice(0, quota);
    assert(selected[type].length === quota, `Not enough ${type} rows after review`);
    const actual = selected[type].map(({ sourceRow }) => sourceRow);
    const approved = review.acceptedSourceRows[type];
    assert(
      JSON.stringify(actual) === JSON.stringify(approved),
      `Hand review does not match the generated ${type} sample. Expected ${JSON.stringify(actual)}`,
    );
  }
  return Object.values(selected).flat();
}

function parseUciHam(buffer) {
  return buffer
    .toString("utf8")
    .split(/\r?\n/)
    .map((line, index) => ({ line, sourceRow: index + 1 }))
    .filter(({ line }) => line.startsWith("ham\t"))
    .map(({ line, sourceRow }) => ({ text: line.slice(4), sourceRow }));
}

function parseTranco(input) {
  return input
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const comma = line.indexOf(",");
      return {
        rank: Number.parseInt(line.slice(0, comma), 10),
        domain: line.slice(comma + 1),
      };
    });
}

function parseOpenPhish(input) {
  return [...new Set(input.trim().split(/\r?\n/).filter(Boolean))];
}

async function writeJsonl(name, records) {
  const contents = `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
  await writeFile(path.join(EVAL_DIR, name), contents, "utf8");
}

export async function buildScamReviewDraft(rejectedRows = []) {
  const imc = await download(SOURCES.imc, "IMC 2025 dataset");
  const rows = csvObjects(imc.toString("utf8"));
  const rejected = new Set(rejectedRows);
  return Object.fromEntries(
    Object.entries(SCAM_QUOTAS).map(([type, quota]) => [
      type,
      orderedScamCandidates(rows, type)
        .filter((row) => !rejected.has(row.sourceRow))
        .slice(0, quota)
        .map(({ sourceRow }) => sourceRow),
    ]),
  );
}

async function main() {
  const review = JSON.parse(await readFile(path.join(EVAL_DIR, "scam-review.json"), "utf8"));
  const [imc, uciZip, trancoCsv, openPhishFeed] = await Promise.all([
    download(SOURCES.imc, "IMC 2025 dataset"),
    download(SOURCES.uci, "UCI SMS Spam Collection"),
    download(SOURCES.tranco, "Tranco list Y8YQG"),
    download(SOURCES.openPhish, "OpenPhish September 11 feed"),
  ]);

  const scamRows = selectScams(csvObjects(imc.toString("utf8")), review);
  const hamRows = shuffle(
    parseUciHam(unzipEntry(uciZip, "SMSSpamCollection")),
    UCI_SEED,
  ).slice(0, 150);
  const trancoRows = shuffle(
    parseTranco(trancoCsv.toString("utf8")).filter(
      ({ rank }) => rank >= 100_001 && rank <= 1_000_000,
    ),
    TRANCO_SEED,
  ).slice(0, 100);
  const openPhishUrls = shuffle(
    parseOpenPhish(openPhishFeed.toString("utf8")),
    OPENPHISH_SEED,
  ).slice(0, 150);

  assert(scamRows.length === 200, "Expected 200 reviewed scam texts");
  assert(hamRows.length === 150, "Expected 150 UCI ham texts");
  assert(trancoRows.length === 100, "Expected 100 Tranco domains");
  assert(BRAND_LINKS.length === 50, "Expected 50 hand-curated brand links");
  assert(openPhishUrls.length === 150, "Expected 150 OpenPhish URLs");

  await mkdir(path.join(EVAL_DIR, "private"), { recursive: true });
  await Promise.all([
    writeJsonl(
      "scam-texts.jsonl",
      scamRows.map((row) => ({
        text: row.text,
        label: "scam",
        source: "imc-2025-smishing",
        sourceRow: row.sourceRow,
        type: row.scam_type,
        ...(row.named_entity ? { brand: row.named_entity } : {}),
      })),
    ),
    writeJsonl(
      "legitimate-texts.jsonl",
      hamRows.map((row) => ({
        text: row.text,
        label: "legit",
        source: "uci-sms-spam-collection",
        sourceRow: row.sourceRow,
      })),
    ),
    writeJsonl(
      "tranco-links.jsonl",
      trancoRows.map(({ rank, domain }) => ({
        url: `https://${domain}`,
        label: "legit",
        source: "tranco-Y8YQG",
        sourceId: String(rank),
        rank,
      })),
    ),
    writeJsonl(
      "brand-links.jsonl",
      BRAND_LINKS.map((url) => ({
        url,
        label: "legit",
        source: "hand-curated-brand-links",
      })),
    ),
    writeJsonl(
      "private/phishing-links.jsonl",
      openPhishUrls.map((url) => ({
        url,
        label: "phishing",
        source: "openphish-community-feed-2026-09-11",
      })),
    ),
  ]);

  console.log("Prepared 200 scam texts, 150 legitimate texts, and 300 link records.");
  console.log("Private OpenPhish records were written to eval/private/phishing-links.jsonl.");
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
