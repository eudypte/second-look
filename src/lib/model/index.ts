import type { LinkReport, ModelReading } from "@/lib/types";

export async function readMessage(
  text: string,
  links: LinkReport[],
): Promise<ModelReading> {
  void text;
  void links;

  return { tier: "none", explanation: "" };
}
