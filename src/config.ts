import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { DEFAULT_CONFIG, type TnConfig } from "./types.js";

const CONFIG_DIR = join(homedir(), ".truenorth");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const AUTH_TOKEN_FILE = join(CONFIG_DIR, "auth_token");

export function getAuthToken(): string | undefined {
  try {
    if (existsSync(AUTH_TOKEN_FILE)) {
      return readFileSync(AUTH_TOKEN_FILE, "utf-8").trim();
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function loadConfig(): TnConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const raw = readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<TnConfig>;
      return {
        baseUrl: parsed.baseUrl ?? DEFAULT_CONFIG.baseUrl,
      };
    }
  } catch {
    // Fall through to defaults
  }
  return { ...DEFAULT_CONFIG };
}

export function getBaseUrl(): string {
  return process.env.TN_BASE_URL ?? loadConfig().baseUrl;
}
