import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verdictFixtures } from "../../fixtures";

const { checkMessage } = vi.hoisted(() => ({ checkMessage: vi.fn() }));

vi.mock("@/lib/check", () => ({ checkMessage }));

import { POST } from "./route";

function checkRequest(body: unknown) {
  return new Request("http://localhost/api/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/check", () => {
  beforeEach(() => {
    checkMessage.mockReset();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [{}, "Message text must be a string."],
    [{ text: 42 }, "Message text must be a string."],
    [{ text: "   " }, "Message text cannot be empty."],
    [
      { text: "x".repeat(1_001) },
      "Message text must be 1,000 characters or fewer.",
    ],
  ])("rejects invalid message text", async (body, error) => {
    const response = await POST(checkRequest(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
    expect(checkMessage).not.toHaveBeenCalled();
  });

  it("returns the verdict and logs only timing and tier", async () => {
    checkMessage.mockResolvedValue(verdictFixtures.amber);

    const response = await POST(checkRequest({ text: "Please check this" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(verdictFixtures.amber);
    expect(checkMessage).toHaveBeenCalledWith("Please check this");
    expect(console.info).toHaveBeenCalledWith("message check completed", {
      durationMs: expect.any(Number),
      tier: "amber",
    });
  });
});
