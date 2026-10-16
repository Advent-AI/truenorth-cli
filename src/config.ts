import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { DEFAULT_CONFIG, type TnConfig } from "./types.js";

const CONFIG_DIR = join(homedir(), ".truenorth");
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const LEGACY_DEFAULT_BASE_URL = "https://api.adventai.io/api/agent-tools";

export function loadConfig(configFile = CONFIG_FILE): TnConfig {
  try {
    if (existsSync(configFile)) {
      const raw = readFileSync(configFile, "utf-8");
      const parsed = JSON.parse(raw) as Partial<TnConfig>;
      return {
        baseUrl: resolveBaseUrl(parsed.baseUrl),
        ...(typeof parsed.apiKey === "string" && parsed.apiKey ? { apiKey: parsed.apiKey } : {}),
      };
    }
  } catch (error: unknown) {
    warnReadFailure("configuration", error);
  }
  return { ...DEFAULT_CONFIG };
}

export function getBaseUrl(): string {
  return process.env.TN_BASE_URL ?? loadConfig().baseUrl;
}

// TN_API_KEY wins over the saved key, so scripts and agents never need the saved one.
export function getApiKey(configFile = CONFIG_FILE): string | undefined {
  return process.env.TN_API_KEY?.trim() || loadConfig(configFile).apiKey;
}

export function saveApiKey(apiKey: string, configFile = CONFIG_FILE): void {
  writeStoredConfig(configFile, { ...readStoredConfig(configFile), apiKey });
}

export function removeApiKey(configFile = CONFIG_FILE): boolean {
  const stored = readStoredConfig(configFile);
  if (!("apiKey" in stored)) {
    return false;
  }
  delete stored.apiKey;
  writeStoredConfig(configFile, stored);
  return true;
}

function readStoredConfig(configFile: string): Record<string, unknown> {
  if (!existsSync(configFile)) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configFile, "utf-8"));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not update ${configFile}: ${message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Could not update ${configFile}: it does not contain a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

function writeStoredConfig(configFile: string, stored: Record<string, unknown>): void {
  // The file holds the API key, so only its owner may read it.
  mkdirSync(dirname(configFile), { recursive: true, mode: 0o700 });
  writeFileSync(configFile, `${JSON.stringify(stored, null, 2)}\n`, { mode: 0o600 });
  // `mode` above only applies when the file is created; tighten an existing one too.
  chmodSync(configFile, 0o600);
}

function resolveBaseUrl(configuredBaseUrl: unknown): string {
  if (typeof configuredBaseUrl !== "string" || !configuredBaseUrl) {
    return DEFAULT_CONFIG.baseUrl;
  }

  // npm uninstall/install preserves ~/.truenorth/config.json. Migrate the
  // previous default so existing users actually reach the v1 tn-api surface.
  if (configuredBaseUrl.replace(/\/+$/, "") === LEGACY_DEFAULT_BASE_URL) {
    return DEFAULT_CONFIG.baseUrl;
  }

  return configuredBaseUrl;
}

function warnReadFailure(source: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`Warning: Could not read TrueNorth ${source}: ${message}`);
}
