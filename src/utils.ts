import chalk from "chalk";
import ora, { type Ora } from "ora";
import Table from "cli-table3";
import type { Command } from "commander";

// ── Spinner ──────────────────────────────────────────────────────────
export function startSpinner(text: string): Ora {
  return ora({ text, spinner: "dots" }).start();
}

// ── wrapAction ───────────────────────────────────────────────────────
// Wraps a command action with error handling and spinner management.
export function wrapAction(
  fn: (...args: unknown[]) => Promise<void>,
): (...args: unknown[]) => Promise<void> {
  return async (...args: unknown[]) => {
    try {
      await fn(...args);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\nError: ${msg}`));
      process.exit(1);
    }
  };
}

// ── Formatting helpers ───────────────────────────────────────────────

export function formatPrice(value: number | string | undefined): string {
  if (value === undefined || value === null) return chalk.dim("—");
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return chalk.dim("—");
  if (Math.abs(n) >= 1) {
    return chalk.white(`$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }
  return chalk.white(`$${n.toPrecision(4)}`);
}

export function formatPercent(value: number | string | undefined): string {
  if (value === undefined || value === null) return chalk.dim("—");
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return chalk.dim("—");
  const formatted = `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
  return n >= 0 ? chalk.green(formatted) : chalk.red(formatted);
}

export function formatNumber(value: number | string | undefined): string {
  if (value === undefined || value === null) return chalk.dim("—");
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return chalk.dim("—");
  if (Math.abs(n) >= 1_000_000_000) return chalk.white(`${(n / 1_000_000_000).toFixed(2)}B`);
  if (Math.abs(n) >= 1_000_000) return chalk.white(`${(n / 1_000_000).toFixed(2)}M`);
  if (Math.abs(n) >= 1_000) return chalk.white(`${(n / 1_000).toFixed(2)}K`);
  return chalk.white(n.toLocaleString("en-US"));
}

export function formatRisk(level: string | undefined): string {
  if (!level) return chalk.dim("—");
  const upper = level.toUpperCase();
  if (upper === "CRITICAL" || upper === "VERY HIGH") return chalk.bgRed.white(` ${upper} `);
  if (upper === "HIGH") return chalk.red(upper);
  if (upper === "MEDIUM" || upper === "MODERATE") return chalk.yellow(upper);
  if (upper === "LOW") return chalk.green(upper);
  return chalk.white(level);
}

export function formatDuration(ms: number): string {
  return chalk.dim(`(${(ms / 1000).toFixed(1)}s)`);
}

export function formatAddress(addr: string | undefined): string {
  if (!addr) return chalk.dim("—");
  return chalk.yellow(addr);
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

// ── Table builder ────────────────────────────────────────────────────

export function makeTable(head: string[], rows: string[][]): string {
  const table = new Table({
    head: head.map((h) => chalk.cyan.bold(h)),
    style: { head: [], border: ["dim"] },
    wordWrap: true,
  });
  for (const row of rows) {
    table.push(row);
  }
  return table.toString();
}

// ── Key-value display ────────────────────────────────────────────────

export function printKeyValue(pairs: [string, string][]): void {
  const maxKey = Math.max(...pairs.map(([k]) => k.length));
  for (const [key, value] of pairs) {
    console.log(`  ${chalk.cyan(key.padEnd(maxKey))}  ${value}`);
  }
}

// ── JSON output helper ──────────────────────────────────────────────

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

// ── Get --json flag from commander opts ──────────────────────────────

export function isJsonMode(opts: Record<string, unknown>): boolean {
  return opts.json === true;
}

// ── kebab-case to snake_case ─────────────────────────────────────────

export function kebabToSnake(str: string): string {
  return str.replace(/-/g, "_");
}

// ── Parse dynamic args from remaining argv ───────────────────────────
// Turns ["--token-address", "bitcoin", "--timeframe", "4h"] into
// { token_address: "bitcoin", timeframe: "4h" }
export function parseDynamicArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const curr = argv[i];
    if (curr.startsWith("--")) {
      const key = kebabToSnake(curr.slice(2));
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = "true";
      }
    }
  }
  return args;
}

// ── Smart result formatter ───────────────────────────────────────────
// Attempts to render unknown API result data in a readable way.
export function formatResult(result: unknown): void {
  if (result === null || result === undefined) {
    console.log(chalk.dim("  (no data)"));
    return;
  }

  if (typeof result === "string") {
    // Try to detect markdown-ish content and print as-is
    console.log(result);
    return;
  }

  if (Array.isArray(result)) {
    if (result.length === 0) {
      console.log(chalk.dim("  (empty list)"));
      return;
    }
    // If array of objects, try table format
    if (typeof result[0] === "object" && result[0] !== null) {
      const keys = Object.keys(result[0]).slice(0, 8); // max 8 cols
      const rows = result.map((item) =>
        keys.map((k) => {
          const v = (item as Record<string, unknown>)[k];
          return v === null || v === undefined ? "—" : String(v);
        }),
      );
      console.log(makeTable(keys, rows));
      return;
    }
    // Simple array
    for (const item of result) {
      console.log(`  • ${String(item)}`);
    }
    return;
  }

  if (typeof result === "object") {
    const obj = result as Record<string, unknown>;
    const pairs: [string, string][] = [];
    for (const [key, val] of Object.entries(obj)) {
      if (val !== null && val !== undefined && typeof val !== "object") {
        const formatted = formatSmartValue(key, val);
        pairs.push([key, formatted]);
      }
    }
    if (pairs.length > 0) {
      printKeyValue(pairs);
    }
    // Print nested objects
    for (const [key, val] of Object.entries(obj)) {
      if (val && typeof val === "object") {
        console.log(`\n  ${chalk.cyan.bold(key)}:`);
        formatResult(val);
      }
    }
    return;
  }

  console.log(String(result));
}

function formatSmartValue(key: string, value: unknown): string {
  const s = String(value);
  const k = key.toLowerCase();

  // Price-like
  if (k.includes("price") || k.includes("tvl") || k.includes("volume") || k.includes("market_cap")) {
    const n = parseFloat(s);
    if (!isNaN(n)) return formatPrice(n);
  }
  // Percent-like
  if (k.includes("change") || k.includes("pct") || k.includes("percent") || k.includes("growth") || k.includes("return")) {
    const n = parseFloat(s);
    if (!isNaN(n)) return formatPercent(n);
  }
  // Risk
  if (k.includes("risk") || k.includes("level") || k.includes("severity")) {
    return formatRisk(s);
  }
  // Address
  if (k.includes("address") || k.includes("addr")) {
    return formatAddress(s);
  }
  return chalk.white(s);
}

// ── Add global --json option to command ──────────────────────────────

export function addJsonOption(cmd: Command): Command {
  return cmd.option("--json", "Output raw JSON");
}
