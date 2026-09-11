import { checkLinks } from "./links";
import { readMessage } from "./model";
import type { Verdict } from "./types";
import { combineVerdict } from "./verdict";

const MAX_MESSAGE_LENGTH = 1_000;

export async function checkMessage(text: string): Promise<Verdict> {
  const message = text.trim().slice(0, MAX_MESSAGE_LENGTH);
  const linkResult = await checkLinks(message);
  const modelReading = await readMessage(message, linkResult.links);

  return combineVerdict(linkResult, modelReading);
}
