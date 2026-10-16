import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listTools } from "../src/api/client.js";
import {
  describeKeyRefusal,
  ensureApiKey,
  isWellFormedApiKey,
  setUpApiKey,
  type PromptIo,
} from "../src/auth.js";
import { removeApiKey } from "../src/config.js";
import { createProgram } from "../src/program.js";

const GOOD_KEY = `ak_${"a".repeat(32)}`;
const OTHER_KEY = `ak_${"b".repeat(32)}`;
const CUSTOM_BASE_URL = "http://127.0.0.1:8000/api/agent-tools";

let directory: string;
let configFile: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "truenorth-cli-auth-"));
  configFile = join(directory, "config.json");
  process.env.TN_BASE_URL = "https://example.test/api/agent-tools";
  delete process.env.TN_API_KEY;
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.TN_BASE_URL;
  delete process.env.TN_API_KEY;
});

// A terminal that answers each prompt in turn and records what it was told.
function scriptedIo(answers: string[], interactive = true) {
  const lines: string[] = [];
  const promptSecret = vi.fn(async () => answers.shift() ?? "");
  const io: PromptIo = { interactive, promptSecret, say: (line) => lines.push(line) };
  return { io, lines, promptSecret };
}

function refusal(code: string, message: string) {
  return { ok: false, status: 401, text: async () => JSON.stringify({ detail: { code, message } }) };
}

describe("API key format", () => {
  it("accepts only ak_ followed by 32 lowercase hex characters", () => {
    expect(isWellFormedApiKey(GOOD_KEY)).toBe(true);
    expect(isWellFormedApiKey(GOOD_KEY.toUpperCase())).toBe(false);
    expect(isWellFormedApiKey(`${GOOD_KEY}0`)).toBe(false);
    expect(isWellFormedApiKey("sk-not-a-truenorth-key")).toBe(false);
  });
});

describe("ensureApiKey", () => {
  it("prefers TN_API_KEY over the saved key", async () => {
    writeFileSync(configFile, JSON.stringify({ apiKey: OTHER_KEY }));
    process.env.TN_API_KEY = GOOD_KEY;

    await expect(ensureApiKey({ io: scriptedIo([]).io, configFile })).resolves.toBe(GOOD_KEY);
  });

  it("uses the saved key without asking", async () => {
    writeFileSync(configFile, JSON.stringify({ apiKey: GOOD_KEY }));
    const { io, promptSecret } = scriptedIo([]);

    await expect(ensureApiKey({ io, configFile })).resolves.toBe(GOOD_KEY);
    expect(promptSecret).not.toHaveBeenCalled();
  });

  it("refuses a malformed key before any request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    writeFileSync(configFile, JSON.stringify({ apiKey: "not-a-key" }));

    await expect(ensureApiKey({ io: scriptedIo([]).io, configFile })).rejects.toThrow(
      `The API key saved in ${configFile} is not a TrueNorth API key. Run \`tn login\``,
    );
    process.env.TN_API_KEY = "not-a-key";
    await expect(ensureApiKey({ io: scriptedIo([]).io, configFile })).rejects.toThrow(
      "TN_API_KEY is not a TrueNorth API key",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tells a caller without a terminal how to provide a key", async () => {
    await expect(ensureApiKey({ io: scriptedIo([], false).io, configFile })).rejects.toThrow(
      "No TrueNorth API key. Set TN_API_KEY, or run `tn login` in a terminal. "
        + "Create a key at https://app.truenorth.xyz/credits.",
    );
  });

  it("asks for a key on first run, checks it, and saves it for the owner only", async () => {
    writeFileSync(configFile, JSON.stringify({ baseUrl: CUSTOM_BASE_URL }));
    const cancelBody = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, body: { cancel: cancelBody } });
    vi.stubGlobal("fetch", fetchMock);
    const { io, lines } = scriptedIo([` ${GOOD_KEY}\n`]);

    await expect(ensureApiKey({ io, configFile })).resolves.toBe(GOOD_KEY);
    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/agent-tools", {
      headers: { Authorization: `Bearer ${GOOD_KEY}` },
    });
    // An unread catalog body keeps the connection, and with it the process, alive.
    expect(cancelBody).toHaveBeenCalledOnce();
    expect(JSON.parse(readFileSync(configFile, "utf-8"))).toEqual({
      baseUrl: CUSTOM_BASE_URL,
      apiKey: GOOD_KEY,
    });
    expect(statSync(configFile).mode & 0o777).toBe(0o600);
    expect(lines.at(-1)).toContain(`API key verified and saved to ${configFile}.`);
  });
});

describe("setUpApiKey", () => {
  it("asks again after a malformed or refused key", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(refusal("api_key_expired", "API key has expired."))
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const { io, lines } = scriptedIo(["sk-not-a-truenorth-key", OTHER_KEY, GOOD_KEY]);

    await expect(setUpApiKey({ io, configFile })).resolves.toBe(GOOD_KEY);
    // The malformed answer never reaches the API.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(lines).toContainEqual(expect.stringContaining("That is not a TrueNorth API key"));
    expect(lines).toContainEqual(
      expect.stringContaining("TrueNorth refused that key (api_key_expired). API key has expired."),
    );
    expect(JSON.parse(readFileSync(configFile, "utf-8"))).toEqual({ apiKey: GOOD_KEY });
  });

  it("gives up after three refused keys and saves nothing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(refusal("api_key_invalid", "API key is not valid.")));
    const { io, promptSecret } = scriptedIo([GOOD_KEY, OTHER_KEY, GOOD_KEY, OTHER_KEY]);

    await expect(setUpApiKey({ io, configFile })).rejects.toThrow("No valid API key after 3 attempts.");
    expect(promptSecret).toHaveBeenCalledTimes(3);
    expect(existsSync(configFile)).toBe(false);
  });

  it("saves the key with a warning when the API cannot check it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("getaddrinfo ENOTFOUND example.test")));
    const { io, lines } = scriptedIo([GOOD_KEY]);

    await expect(setUpApiKey({ io, configFile })).resolves.toBe(GOOD_KEY);
    expect(lines.at(-1)).toContain("could not be checked right now (getaddrinfo ENOTFOUND example.test)");
    expect(JSON.parse(readFileSync(configFile, "utf-8"))).toEqual({ apiKey: GOOD_KEY });
  });
});

describe("refused keys", () => {
  it("turns tn-api's refusal into a fix the user can act on", async () => {
    process.env.TN_API_KEY = GOOD_KEY;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(refusal("api_key_expired", "API key has expired.")));

    const response = await listTools();

    expect(response).toEqual({
      ok: false,
      status: 401,
      error: "TrueNorth refused the API key (api_key_expired). API key has expired. "
        + "Check TN_API_KEY, or create a new key at https://app.truenorth.xyz/credits.",
    });
  });

  it("points a saved key's owner at tn login and the environment's key page", () => {
    process.env.TN_BASE_URL = "https://staging-tn-api.truenorth.xyz/api/agent-tools";

    expect(describeKeyRefusal({ code: "api_key_invalid", message: "API key is not valid." })).toBe(
      "TrueNorth refused the API key (api_key_invalid). API key is not valid. "
        + "Run `tn login` to enter a new key (create one at https://app.staging.truenorth.xyz/credits).",
    );
  });

  it("stops a command before any request when the key is unusable", async () => {
    process.env.TN_API_KEY = "not-a-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as never);

    await expect(createProgram().parseAsync(["tools", "--json"], { from: "user" })).rejects.toThrow("exit 1");
    expect(error).toHaveBeenCalledWith(expect.stringContaining("TN_API_KEY is not a TrueNorth API key"));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("removeApiKey", () => {
  it("removes only the key and reports whether there was one", () => {
    writeFileSync(configFile, JSON.stringify({ baseUrl: CUSTOM_BASE_URL, apiKey: GOOD_KEY }));

    expect(removeApiKey(configFile)).toBe(true);
    expect(JSON.parse(readFileSync(configFile, "utf-8"))).toEqual({ baseUrl: CUSTOM_BASE_URL });
    expect(removeApiKey(configFile)).toBe(false);
  });
});
