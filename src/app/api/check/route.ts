import { NextResponse } from "next/server";
import { checkMessage } from "@/lib/check";

const MAX_LENGTH = 1_000;

export async function POST(request: Request) {
  const startedAt = performance.now();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const text =
    typeof body === "object" && body !== null && "text" in body
      ? (body as { text?: unknown }).text
      : undefined;

  if (typeof text !== "string") {
    return NextResponse.json(
      { error: "Message text must be a string." },
      { status: 400 },
    );
  }

  if (!text.trim()) {
    return NextResponse.json(
      { error: "Message text cannot be empty." },
      { status: 400 },
    );
  }

  if (text.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: "Message text must be 1,000 characters or fewer." },
      { status: 400 },
    );
  }

  const verdict = await checkMessage(text);
  console.info("message check completed", {
    durationMs: Math.round(performance.now() - startedAt),
    tier: verdict.tier,
  });

  return NextResponse.json(verdict);
}
