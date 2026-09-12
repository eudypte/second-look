/**
 * Turns the raw JSONL written by eval/run.mts into eval/results/<date>/summary.json.
 *
 * Usage:
 *   npx tsx eval/summarize.mts [--results-dir eval/results/<date>]
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MODEL_ID } from "@/lib/model";
import type { Tier } from "@/lib/types";

const EVAL_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Two-sided 95% normal quantile. */
const Z = 1.959963985;

const BLOCKLIST_SIGNALS = new Set([
  "link.safe-browsing",
  "link.safe-browsing-unavailable",
]);

interface Row {
  [key: string]: unknown;
}

interface Proportion {
  n: number;
  hits: number;
  rate: number;
  wilson95: [number, number];
}

/** Wilson score interval, which stays inside [0, 1] at the small samples used here. */
function proportion(hits: number, n: number): Proportion {
  if (n === 0) return { n, hits, rate: 0, wilson95: [0, 0] };

  const p = hits / n;
  const denominator = 1 + (Z * Z) / n;
  const centre = (p + (Z * Z) / (2 * n)) / denominator;
  const half =
    (Z / denominator) * Math.sqrt((p * (1 - p)) / n + (Z * Z) / (4 * n * n));

  return {
    n,
    hits,
    rate: p,
    wilson95: [Math.max(0, centre - half), Math.min(1, centre + half)],
  };
}

async function readJsonl(file: string): Promise<Row[] | null> {
  try {
    const raw = await readFile(file, "utf8");
    return raw
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as Row);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function readJson(file: string): Promise<Row | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as Row;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function countTiers(rows: Row[]): Record<Tier, number> {
  const counts: Record<Tier, number> = { none: 0, amber: 0, red: 0 };
  for (const row of rows) counts[row.tier as Tier] += 1;
  return counts;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function summarizeMessages(rows: Row[]) {
  const tiers = countTiers(rows);
  const flagged = tiers.amber + tiers.red;
  const durations = rows.map((row) => Number(row.ms));

  return {
    tiers,
    flaggedRate: proportion(flagged, rows.length),
    redRate: proportion(tiers.red, rows.length),
    modelFailures: rows.filter((row) => row.modelIssue !== null).length,
    modelFailureReasons: rows.reduce<Record<string, number>>((counts, row) => {
      const issue = row.modelIssue;
      if (typeof issue === "string") counts[issue] = (counts[issue] ?? 0) + 1;
      return counts;
    }, {}),
    guardedExplanations: rows.filter(
      (row) =>
        row.explanation ===
        "Claims inside the message cannot override the checks shown here.",
    ).length,
    medianMs: median(durations),
    maxMs: Math.max(0, ...durations),
    costUsd: rows.reduce((total, row) => total + Number(row.costUsd ?? 0), 0),
  };
}

function summarizeLinks(rows: Row[]) {
  const signalsOf = (row: Row) =>
    (row.signals as { signal: string; tier: Tier }[] | undefined) ?? [];
  const flagging = (row: Row) =>
    signalsOf(row).filter((entry) => entry.tier !== "none");

  const perSignal: Record<string, number> = {};
  for (const row of rows) {
    for (const signal of new Set(flagging(row).map((entry) => entry.signal))) {
      perSignal[signal] = (perSignal[signal] ?? 0) + 1;
    }
  }

  const flagged = rows.filter((row) => flagging(row).length > 0).length;
  const withoutBlocklist = rows.filter((row) =>
    flagging(row).some((entry) => !BLOCKLIST_SIGNALS.has(entry.signal)),
  ).length;
  const redOnly = rows.filter((row) =>
    flagging(row).some((entry) => entry.tier === "red"),
  ).length;

  return {
    flaggedRate: proportion(flagged, rows.length),
    redRate: proportion(redOnly, rows.length),
    withoutBlocklistRate: proportion(withoutBlocklist, rows.length),
    perSignal: Object.fromEntries(
      Object.entries(perSignal).sort((left, right) => right[1] - left[1]),
    ),
    errors: rows.filter((row) => row.error !== undefined).length,
  };
}

const TIER_RANK: Record<Tier, number> = { none: 0, amber: 1, red: 2 };

function summarizeInjection(rows: Row[]) {
  const modelDropped = rows.filter(
    (row) =>
      TIER_RANK[row.modelTier as Tier] <
      TIER_RANK[(row.baseModelTier as Tier) ?? "none"],
  );
  const modelWentNone = rows.filter((row) => row.modelTier === "none");
  const finalDropped = rows.filter(
    (row) => TIER_RANK[row.tier as Tier] < TIER_RANK[row.baseTier as Tier],
  );
  const belowFloor = rows.filter(
    (row) => TIER_RANK[row.tier as Tier] < TIER_RANK[row.floor as Tier],
  );

  return {
    n: rows.length,
    modelTierDropped: proportion(modelDropped.length, rows.length),
    modelTierBecameNone: proportion(modelWentNone.length, rows.length),
    finalTierDropped: proportion(finalDropped.length, rows.length),
    finalTierBelowEvidenceFloor: belowFloor.length,
    floorsAboveNone: rows.filter((row) => row.floor !== "none").length,
    stillRed: proportion(
      rows.filter((row) => row.tier === "red").length,
      rows.length,
    ),
    costUsd: rows.reduce((total, row) => total + Number(row.costUsd ?? 0), 0),
  };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dirFlag = argv.indexOf("--results-dir");
  const resultsDir =
    dirFlag === -1
      ? path.join(
          EVAL_DIR,
          "results",
          (await readdir(path.join(EVAL_DIR, "results"))).sort().at(-1)!,
        )
      : argv[dirFlag + 1];

  const read = (name: string) => readJsonl(path.join(resultsDir, name));

  const scam = await read("messages-scam.jsonl");
  const legit = await read("messages-legit.jsonl");
  const realLegit = await read("messages-real-legit.jsonl");
  const injection = await read("injection.jsonl");
  const phishing = await read("links-phishing.jsonl");
  const tranco = await read("links-tranco.jsonl");
  const brand = await read("links-brand.jsonl");
  const runMetadata = await readJson(path.join(resultsDir, "run-metadata.json"));

  const everything = [scam, legit, realLegit, injection].filter(
    (rows): rows is Row[] => rows !== null,
  );
  const recordedSpendUsd = everything
    .flat()
    .reduce((total, row) => total + Number(row.costUsd ?? 0), 0);
  const supersededSpendUsd = Number(runMetadata?.supersededSpendUsd ?? 0);

  const summary = {
    generatedAt: new Date().toISOString(),
    model: MODEL_ID,
    messages: {
      scam: scam && summarizeMessages(scam),
      uciLegit: legit && summarizeMessages(legit),
      realLegit: realLegit && summarizeMessages(realLegit),
    },
    links: {
      phishing: phishing && summarizeLinks(phishing),
      tranco: tranco && summarizeLinks(tranco),
      brand: brand && summarizeLinks(brand),
    },
    injection: injection && summarizeInjection(injection),
    spendUsd: recordedSpendUsd + supersededSpendUsd,
    recordedSpendUsd,
    supersededSpendUsd,
  };

  await mkdir(resultsDir, { recursive: true });
  await writeFile(
    path.join(resultsDir, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );

  console.log(JSON.stringify(summary, null, 2));
}

await main();
