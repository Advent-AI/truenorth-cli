import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { batchCallTools } from "../src/api/client.js";
import { getBaseUrl, loadConfig } from "../src/config.js";
import { createProgram } from "../src/program.js";
import { DEFAULT_CONFIG } from "../src/types.js";
import { parseDynamicArgs } from "../src/utils.js";

const TEST_API_KEY = `ak_${"0".repeat(32)}`;

beforeEach(() => {
  process.env.TN_API_KEY = TEST_API_KEY;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.TN_BASE_URL;
  delete process.env.TN_API_KEY;
});

describe("command surface", () => {
  it("contains only tools, call, batch, login, and logout", () => {
    const commands = createProgram().commands.map((command) => command.name());
    expect(commands).toEqual(["tools", "call", "batch", "login", "logout"]);
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

  it("uses the default base URL when no config file exists", () => {
    const directory = mkdtempSync(join(tmpdir(), "truenorth-cli-config-"));

    try {
      expect(loadConfig(join(directory, "missing.json")).baseUrl).toBe(
        DEFAULT_CONFIG.baseUrl,
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("warns and uses the default when the config file is invalid", () => {
    const directory = mkdtempSync(join(tmpdir(), "truenorth-cli-config-"));
    const configFile = join(directory, "config.json");
    writeFileSync(configFile, "not JSON");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      expect(loadConfig(configFile).baseUrl).toBe(DEFAULT_CONFIG.baseUrl);
      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining("Could not read TrueNorth configuration"),
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("migrates the persisted pre-v1 default base URL", () => {
    const directory = mkdtempSync(join(tmpdir(), "truenorth-cli-config-"));
    const configFile = join(directory, "config.json");
    writeFileSync(configFile, JSON.stringify({
      baseUrl: "https://api.adventai.io/api/agent-tools",
    }));

    try {
      expect(loadConfig(configFile).baseUrl).toBe(DEFAULT_CONFIG.baseUrl);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("preserves an explicitly configured custom base URL", () => {
    const directory = mkdtempSync(join(tmpdir(), "truenorth-cli-config-"));
    const configFile = join(directory, "config.json");
    writeFileSync(configFile, JSON.stringify({
      baseUrl: "http://127.0.0.1:8000/api/agent-tools",
    }));

    try {
      expect(loadConfig(configFile).baseUrl).toBe(
        "http://127.0.0.1:8000/api/agent-tools",
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("prefers TN_BASE_URL over persisted configuration", () => {
    process.env.TN_BASE_URL = "https://override.test/api/agent-tools";

    expect(getBaseUrl()).toBe("https://override.test/api/agent-tools");
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_API_KEY}`,
        },
        body: JSON.stringify({
          calls: [
            { toolName: "example_tool", arguments: { limit: 10 } },
          ],
        }),
      }),
    );
  });
});
