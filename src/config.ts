import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { DEFAULT_CONFIG, type TnConfig } from "./types.js";

const CONFIG_DIR = join(homedir(), ".truenorth");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const LEGACY_DEFAULT_BASE_URL = "https://api.adventai.io/api/agent-tools";

export function loadConfig(configFile = CONFIG_FILE): TnConfig {
  try {
    if (existsSync(configFile)) {
      const raw = readFileSync(configFile, "utf-8");
      const parsed = JSON.parse(raw) as Partial<TnConfig>;
      return {
        baseUrl: resolveBaseUrl(parsed.baseUrl),
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
