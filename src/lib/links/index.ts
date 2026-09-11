import type { LinkCheckResult } from "@/lib/types";

export async function checkLinks(text: string): Promise<LinkCheckResult> {
  void text;

  return { links: [], floor: "none", rows: [] };
}
