import { beforeEach, describe, expect, it, vi } from "vitest";

const sdkMocks = vi.hoisted(() => ({
  create: vi.fn(),
  constructor: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class AnthropicMock {
    messages = { create: sdkMocks.create };

    constructor(options: unknown) {
      sdkMocks.constructor(options);
    }
  },
}));

import { MODEL_ID, readMessage } from "./index";

describe("readMessage", () => {
  beforeEach(() => {
    sdkMocks.create.mockReset();
    sdkMocks.constructor.mockReset();
  });

  it("makes one structured Haiku call with quoted data and link evidence", async () => {
    sdkMocks.create.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            tier: "amber",
            explanation: 'The deadline "pay today" adds pressure to tap.',
          }),
        },
      ],
    });
    const links = [
      {
        raw: "https://example.com/pay",
        host: "example.com",
        finalUrl: "https://example.com/pay",
        evidence: [
          {
            signal: "young-domain",
            tier: "amber" as const,
            text: "This website was set up 45 days ago.",
          },
        ],
      },
    ];

    const result = await readMessage("Pay today", links);

    expect(result).toEqual({
      tier: "amber",
      explanation: 'The deadline "pay today" adds pressure to tap.',
    });
    expect(sdkMocks.create).toHaveBeenCalledTimes(1);
    expect(sdkMocks.constructor).toHaveBeenCalledWith({
      maxRetries: 0,
      timeout: 30_000,
    });

    const request = sdkMocks.create.mock.calls[0][0];
    expect(request.model).toBe(MODEL_ID);
    expect(request.max_tokens).toBe(180);
    expect(request.output_config.format).toMatchObject({
      type: "json_schema",
      schema: {
        required: ["tier", "explanation"],
        properties: {
          tier: { enum: ["none", "amber", "red"] },
        },
      },
    });
    expect(request.messages[0].content).toContain(
      'Quoted message data:\n"Pay today"',
    );
    expect(request.messages[0].content).toContain(
      "This website was set up 45 days ago.",
    );
    expect(request.system).toContain("Genuine alerts tell you what happened");
    expect(request.system).toContain(
      "a keyword reply such as YES, NO, STOP, HELP, or one letter; a call to the number on the back of your card",
    );
    expect(request.system).toContain(
      "Do not treat those requests as suspicious, even alongside a fraud warning",
    );
    expect(request.system).toContain(
      "use a link or an unfamiliar number in the message to verify, sign in, pay, claim a prize or refund, reschedule or release a delivery",
    );
    expect(request.system).toContain(
      "Choose red for a new-number, broken-phone, or family-emergency story from an unknown sender even before money is mentioned",
    );
    expect(request.system).toContain(
      "Choose amber for any other risky request, even when the message sounds routine",
    );
    expect(request.system).not.toContain(
      "If no risky action is requested, choose none",
    );
  });

  it("caps explanations at 60 words", async () => {
    sdkMocks.create.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            tier: "red",
            explanation: Array.from({ length: 65 }, (_, index) => `w${index}`).join(
              " ",
            ),
          }),
        },
      ],
    });

    const result = await readMessage("Send a gift card", []);

    expect(result.explanation.split(" ")).toHaveLength(60);
    expect(result.explanation).toContain("w59");
    expect(result.explanation).not.toContain("w60");
  });

  it("returns an empty none reading when the model call fails", async () => {
    sdkMocks.create.mockRejectedValue(new Error("timeout"));

    await expect(readMessage("Hello", [])).resolves.toEqual({
      tier: "none",
      explanation: "",
    });
    expect(sdkMocks.create).toHaveBeenCalledTimes(1);
  });
});
