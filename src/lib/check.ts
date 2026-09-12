import { checkLinks } from "@/lib/links";
import { readMessage } from "@/lib/model";
import type { Verdict } from "@/lib/types";

export async function checkMessage(text: string): Promise<Verdict> {
  const linkResult = await checkLinks(text);
  const modelReading = await readMessage(text, linkResult.links);

  return {
    tier: "none",
    headline: "No red flags found.",
    rows: linkResult.rows,
    explanation: modelReading.explanation,
    advice: null,
  };
}
