import { afterEach, describe, expect, it, vi } from "vitest";
import { batchCallTools } from "../src/api/client.js";
import { createProgram } from "../src/program.js";
import { DEFAULT_CONFIG } from "../src/types.js";
import { parseDynamicArgs } from "../src/utils.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.TN_BASE_URL;
});

describe("command surface", () => {
  it("contains only tools, call, and batch", () => {
    const commands = createProgram().commands.map((command) => command.name());
    expect(commands).toEqual(["tools", "call", "batch"]);
  });
});

describe("dynamic arguments", () => {
  it("supports Python CLI forms and JSON value coercion", () => {
    expect(parseDynamicArgs([
      "--token-address",
      "bitcoin",
      "--limit=10",
      "enabled=true",
      "--payload",
      '{"token":"SOL"}',
      "--tags",
      '["market","crypto"]',
      "--flag",
    ])).toEqual({
      token_address: "bitcoin",
      limit: 10,
      enabled: true,
      payload: { token: "SOL" },
      tags: ["market", "crypto"],
      flag: true,
    });
  });

  it("passes dynamically parsed values through the call command", async () => {
    process.env.TN_BASE_URL = "https://example.test/api/agent-tools";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        failed: false,
        message: null,
        code: null,
        data: {
          toolName: "example_tool",
          result: { ok: true },
          durationMs: 5,
          isError: false,
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await createProgram().parseAsync([
      "call",
      "example_tool",
      "--limit",
      "10",
      "--payload",
      '{"token":"SOL"}',
      "--json",
    ], { from: "user" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/api/agent-tools/call",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          toolName: "example_tool",
          arguments: { limit: 10, payload: { token: "SOL" } },
        }),
      }),
    );
  });
});

describe("API configuration", () => {
  it("uses the TrueNorth API as the default base URL", () => {
    expect(DEFAULT_CONFIG.baseUrl).toBe(
      "https://tn-api.truenorth.xyz/api/agent-tools",
    );
  });

  it("posts batch calls using the Python CLI wire shape", async () => {
    process.env.TN_BASE_URL = "https://example.test/api/agent-tools";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        failed: false,
        message: null,
        code: null,
        data: { results: [] },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await batchCallTools([
      { toolName: "example_tool", arguments: { limit: 10 } },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/api/agent-tools/batch",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          calls: [
            { toolName: "example_tool", arguments: { limit: 10 } },
          ],
        }),
      }),
    );
  });
});
