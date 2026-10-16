import chalk from "chalk";
import { CONFIG_FILE, getApiKey, getBaseUrl, saveApiKey } from "./config.js";

// tn-api's well-formed key (`core.billing.key_format.is_well_formed`): `ak_` + 32 lowercase hex.
// tn-api serves any other value anonymously, so only this check stops a typo from passing as valid.
const API_KEY_PATTERN = /^ak_[0-9a-f]{32}$/;
const MAX_SETUP_ATTEMPTS = 3;
// Terminals that wrap a paste in bracketed-paste markers would otherwise corrupt the key.
const BRACKETED_PASTE_MARKERS = /\u001b\[20[01]~/g;
// Raw-mode keys the hidden prompt handles itself.
const CTRL_C = "\u0003";
const LINE_ENDS = new Set(["\r", "\n", "\u0004"]); // Enter, or Ctrl+D
const BACKSPACES = new Set(["\u007f", "\b"]);
// 128 + SIGINT: what a shell reports for a command stopped with Ctrl+C.
const INTERRUPTED_EXIT_CODE = 130;

export type KeyCheck =
  | { status: "valid" }
  | { status: "rejected"; code: string; message: string }
  | { status: "unverified"; reason: string };

export interface KeyRefusal {
  code: string;
  message: string;
}

export interface PromptIo {
  interactive: boolean;
  promptSecret: (question: string) => Promise<string>;
  say: (line: string) => void;
}

// Prompts and notices go to stderr so `--json` output on stdout stays clean for piping.
export const terminalIo: PromptIo = {
  interactive: Boolean(process.stdin.isTTY && process.stderr.isTTY),
  promptSecret: readHiddenLine,
  say: (line) => process.stderr.write(`${line}\n`),
};

export function isWellFormedApiKey(value: string): boolean {
  return API_KEY_PATTERN.test(value);
}

// Each environment's web app issues the keys that environment accepts (tn-api's API_KEY_CREDITS_URL).
export function createKeyUrl(baseUrl = getBaseUrl()): string {
  try {
    if (new URL(baseUrl).hostname.startsWith("staging")) {
      return "https://app.staging.truenorth.xyz/credits";
    }
  } catch {
    // An unparsable base URL fails on the first request with its own error.
  }
  return "https://app.truenorth.xyz/credits";
}

// tn-api refuses an unknown or expired key with 401 and `{"detail": {"code": "api_key_*", "message"}}`.
export function parseKeyRefusal(status: number, body: string): KeyRefusal | null {
  if (status !== 401) {
    return null;
  }
  try {
    const detail = (JSON.parse(body) as { detail?: { code?: unknown; message?: unknown } }).detail;
    if (typeof detail?.code === "string" && detail.code.startsWith("api_key_")) {
      return { code: detail.code, message: typeof detail.message === "string" ? detail.message : "" };
    }
  } catch {
    // Not tn-api's refusal shape; the caller reports the raw response instead.
  }
  return null;
}

export function describeKeyRefusal(refusal: KeyRefusal): string {
  const fix = process.env.TN_API_KEY?.trim()
    ? `Check TN_API_KEY, or create a new key at ${createKeyUrl()}.`
    : `Run \`tn login\` to enter a new key (create one at ${createKeyUrl()}).`;
  return [`TrueNorth refused the API key (${refusal.code}).`, refusal.message, fix].filter(Boolean).join(" ");
}

// One catalog request: tn-api checks a presented key on every route, this keyless one included.
export async function checkApiKey(apiKey: string, baseUrl = getBaseUrl()): Promise<KeyCheck> {
  let response: Response;
  try {
    response = await fetch(baseUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
  } catch (error: unknown) {
    return { status: "unverified", reason: error instanceof Error ? error.message : String(error) };
  }
  if (response.ok) {
    // Only the status matters. An unread body also holds the connection open, so the CLI never exits.
    await response.body?.cancel();
    return { status: "valid" };
  }
  const refusal = parseKeyRefusal(response.status, await response.text().catch(() => ""));
  if (refusal) {
    return { status: "rejected", ...refusal };
  }
  return { status: "unverified", reason: `HTTP ${response.status}` };
}

// The key every request carries. A terminal user without one is asked for it on first run.
export async function ensureApiKey(
  { io = terminalIo, configFile = CONFIG_FILE }: { io?: PromptIo; configFile?: string } = {},
): Promise<string> {
  const apiKey = getApiKey(configFile);
  if (apiKey) {
    if (!isWellFormedApiKey(apiKey)) {
      throw new Error(
        process.env.TN_API_KEY?.trim()
          ? "TN_API_KEY is not a TrueNorth API key (expected ak_ followed by 32 lowercase hex characters)."
          : `The API key saved in ${configFile} is not a TrueNorth API key. Run \`tn login\` to replace it.`,
      );
    }
    return apiKey;
  }
  if (!io.interactive) {
    throw new Error(
      `No TrueNorth API key. Set TN_API_KEY, or run \`tn login\` in a terminal. Create a key at ${createKeyUrl()}.`,
    );
  }
  return setUpApiKey({ io, configFile });
}

// Ask for a key, check it with the API and save it. The first run and `tn login` share this.
export async function setUpApiKey(
  { io = terminalIo, configFile = CONFIG_FILE }: { io?: PromptIo; configFile?: string } = {},
): Promise<string> {
  io.say(`TrueNorth needs an API key. Create one at ${createKeyUrl()} and paste it below.`);
  for (let attempt = 1; attempt <= MAX_SETUP_ATTEMPTS; attempt += 1) {
    const apiKey = (await io.promptSecret("API key (input hidden): "))
      .replace(BRACKETED_PASTE_MARKERS, "")
      .trim();
    if (!isWellFormedApiKey(apiKey)) {
      io.say(chalk.yellow("That is not a TrueNorth API key: keys are ak_ followed by 32 lowercase hex characters."));
      continue;
    }
    const check = await checkApiKey(apiKey);
    if (check.status === "rejected") {
      io.say(chalk.yellow(`TrueNorth refused that key (${check.code}). ${check.message}`.trim()));
      continue;
    }
    saveApiKey(apiKey, configFile);
    io.say(
      check.status === "valid"
        ? chalk.green(`API key verified and saved to ${configFile}.`)
        : chalk.yellow(
            `API key saved to ${configFile}, but it could not be checked right now (${check.reason}). `
              + "Your next request will say so if TrueNorth refuses it.",
          ),
    );
    return apiKey;
  }
  throw new Error(`No valid API key after ${MAX_SETUP_ATTEMPTS} attempts. Create one at ${createKeyUrl()}.`);
}

// Read one line from the terminal without echoing it. Ctrl+C exits as it would anywhere else.
function readHiddenLine(question: string): Promise<string> {
  return new Promise((resolve) => {
    const input = process.stdin;
    let value = "";
    const finish = (): void => {
      input.removeListener("data", onData);
      input.setRawMode(false);
      input.pause();
      process.stderr.write("\n");
      resolve(value);
    };
    const onData = (chunk: string): void => {
      for (const character of chunk) {
        if (LINE_ENDS.has(character)) {
          finish();
          return;
        }
        if (character === CTRL_C) {
          input.setRawMode(false);
          process.stderr.write("\n");
          process.exit(INTERRUPTED_EXIT_CODE);
        }
        value = BACKSPACES.has(character) ? value.slice(0, -1) : value + character;
      }
    };
    // Echo goes off before the prompt shows, so nothing typed after it reaches the screen.
    input.setRawMode(true);
    input.setEncoding("utf8");
    input.resume();
    input.on("data", onData);
    process.stderr.write(question);
  });
}
