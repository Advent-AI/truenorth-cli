import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import {
  startSpinner,
  formatDuration,
  printJson,
  isJsonMode,
  wrapAction,
  addJsonOption,
  makeTable,
} from "../utils.js";

// Thin wrappers around the canonical tn-api HIP-4 tools:
//
//   tn hip4 markets              → tn call hip4_markets
//   tn hip4 details <outcome-id> → tn call hip4_market_details
//
// Both subcommands hit the Discovery Agents tool gateway via
// executeTool() — same code path as every other command in this CLI.
// See tn-mono/services/tn-api/src/tn_api/tools/hip4_*.py for the tool
// implementations.

interface CallResult {
  toolName: string;
  result: unknown;
  durationMs: number;
  isError: boolean;
}

interface OutcomeRow {
  outcome_id?: number;
  name?: string;
  spec?: Record<string, string>;
  ttl_hours?: number | null;
  yes_asset?: string;
  no_asset?: string;
}

export function registerHip4Command(program: Command): void {
  const hip4 = program
    .command("hip4")
    .description("Hyperliquid HIP-4 outcome / prediction markets");

  // ── markets ─────────────────────────────────────────────────────
  const markets = hip4
    .command("markets")
    .description("List active HIP-4 outcome markets");
  addJsonOption(markets);
  markets.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const spinner = startSpinner("Fetching outcome markets…");
      const result = await executeTool("hip4_markets", {});
      spinner.stop();

      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }
      printMarkets(result);
    }),
  );

  // ── details ─────────────────────────────────────────────────────
  const details = hip4
    .command("details <outcome-id>")
    .description("Composite trader view of one outcome market")
    .option("--interval <int>", "Candle interval (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w)", "5m")
    .option("--lookback <window>", "Momentum lookback (e.g. 1h, 4h, 1d)", "1h")
    .option("--trade-sample <n>", "Recent trades sampled per side (1-200)", "50");
  addJsonOption(details);
  details.action(
    wrapAction(async (outcomeId: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const id = parseOutcomeId(outcomeId);
      const args: Record<string, unknown> = {
        outcome_id: id,
        candle_interval: opts.interval as string,
        candle_lookback: opts.lookback as string,
        trade_sample: parsePositiveInt(opts.tradeSample, "--trade-sample"),
      };

      const spinner = startSpinner(`Fetching outcome #${id} details…`);
      const result = await executeTool("hip4_market_details", args);
      spinner.stop();

      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }
      printMarketDetails(result);
    }),
  );
}

// ── Input parsers ───────────────────────────────────────────────────

function parseOutcomeId(raw: unknown): number {
  return parsePositiveInt(raw, "outcome-id");
}

function parsePositiveInt(raw: unknown, label: string): number {
  const text = String(raw ?? "").trim();
  const value = parseInt(text, 10);
  if (Number.isNaN(value) || value < 1 || String(value) !== text) {
    throw new Error(`${label} must be a positive integer (got "${text}")`);
  }
  return value;
}

// ── Pretty-printers ─────────────────────────────────────────────────
//
// These consume the {toolName, result, durationMs, isError} envelope
// produced by executeTool. The `result` payload shape is owned by
// tn-api (see tn_api.tools.hip4_*); the CLI is just rendering.

function printMarkets(envelope: CallResult): void {
  const data = envelope.result as Record<string, unknown>;
  if (data.status === "error") {
    console.error(chalk.red(`\nError: ${data.error}\n`));
    process.exitCode = 1;
    return;
  }
  const outcomes = (data.outcomes ?? []) as OutcomeRow[];

  console.log(
    chalk.bold(`\n  HIP-4 Markets ${formatDuration(envelope.durationMs)}\n`),
  );
  if (!outcomes.length) {
    console.log(chalk.dim("  No active markets.\n"));
    return;
  }

  const rows = outcomes.map((outcome: OutcomeRow) => {
    const spec = outcome.spec ?? {};
    const ttl = outcome.ttl_hours;
    return [
      String(outcome.outcome_id ?? "?"),
      String(outcome.name ?? "?"),
      spec.class ?? "—",
      spec.underlying ?? "—",
      spec.targetPrice ? `$${spec.targetPrice}` : "—",
      spec.period ?? "—",
      typeof ttl === "number" ? `${ttl.toFixed(1)}h` : "—",
      String(outcome.yes_asset ?? "—"),
      String(outcome.no_asset ?? "—"),
    ];
  });
  console.log(
    makeTable(
      ["#", "Name", "Class", "Underlying", "Target", "Period", "TTL", "YES", "NO"],
      rows,
    ),
  );
  console.log();
}

function printMarketDetails(envelope: CallResult): void {
  const data = envelope.result as Record<string, unknown>;
  if (data.status === "error") {
    console.error(chalk.red(`\nError: ${data.error}\n`));
    process.exitCode = 1;
    return;
  }
  const market = (data.market ?? {}) as Record<string, unknown>;
  const quote = (data.quote ?? {}) as Record<string, unknown>;
  const flow = (data.flow ?? {}) as Record<string, unknown>;
  const momentum = (data.momentum ?? {}) as Record<string, unknown>;
  const insights = (data.insights ?? []) as string[];

  console.log(
    chalk.bold(
      `\n  HIP-4 Market #${market.outcome_id} ${formatDuration(envelope.durationMs)}\n`,
    ),
  );

  // Market spec line
  const spec = (market.spec ?? {}) as Record<string, string>;
  const ttl = market.ttl_hours as number | null | undefined;
  console.log(
    chalk.dim(
      `  ${spec.class ?? "?"} · ${spec.underlying ?? "?"}` +
        (spec.targetPrice ? ` > $${spec.targetPrice}` : "") +
        ` · period ${spec.period ?? "?"}` +
        (typeof ttl === "number" ? ` · ${ttl.toFixed(1)}h to expire` : ""),
    ),
  );
  console.log();

  // Insights — the human-readable part agents already pre-computed
  if (insights.length) {
    console.log(chalk.cyan.bold("  Insights"));
    for (const line of insights) {
      console.log(`    • ${line}`);
    }
    console.log();
  }

  // Quote table
  const yes = (quote.yes ?? {}) as Record<string, number | null>;
  const no = (quote.no ?? {}) as Record<string, number | null>;
  console.log(chalk.cyan.bold("  Quote"));
  console.log(
    makeTable(
      ["Side", "Bid", "Ask", "Mid %", "Spread"],
      [
        [
          chalk.green("YES"),
          formatPriceField(yes.best_bid),
          formatPriceField(yes.best_ask),
          formatPercentField(yes.mid_pct),
          formatCentsField(yes.spread_cents),
        ],
        [
          chalk.red("NO"),
          formatPriceField(no.best_bid),
          formatPriceField(no.best_ask),
          formatPercentField(no.mid_pct),
          formatCentsField(no.spread_cents),
        ],
      ],
    ),
  );

  // Flow table
  const yesFlow = (flow.yes ?? {}) as Record<string, unknown>;
  const noFlow = (flow.no ?? {}) as Record<string, unknown>;
  console.log(chalk.cyan.bold("\n  Flow"));
  console.log(
    makeTable(
      ["Side", "Sample", "Buy %", "Interpretation"],
      [
        [
          chalk.green("YES"),
          String(yesFlow.sample_size ?? "—"),
          formatPercentField(yesFlow.buy_pct as number | null | undefined),
          colorInterpretation(yesFlow.interpretation as string | undefined),
        ],
        [
          chalk.red("NO"),
          String(noFlow.sample_size ?? "—"),
          formatPercentField(noFlow.buy_pct as number | null | undefined),
          colorInterpretation(noFlow.interpretation as string | undefined),
        ],
      ],
    ),
  );

  // Momentum
  console.log(chalk.cyan.bold("\n  Momentum"));
  const direction = String(momentum.direction ?? "—");
  console.log(
    `    ${momentum.interval ?? "?"} × ${momentum.lookback ?? "?"} · ` +
      `${momentum.candle_count ?? 0} candles · ` +
      `change ${formatCentsField(momentum.change_cents as number | null | undefined)} · ` +
      `range ${formatCentsField(momentum.range_cents as number | null | undefined)} · ` +
      `${colorDirection(direction)}`,
  );
  console.log();
}

// ── Field formatters ────────────────────────────────────────────────

function formatPriceField(value: unknown): string {
  if (value === null || value === undefined) return chalk.dim("—");
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isNaN(n) ? chalk.dim("—") : `$${n.toFixed(4)}`;
}

function formatPercentField(value: unknown): string {
  if (value === null || value === undefined) return chalk.dim("—");
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isNaN(n) ? chalk.dim("—") : `${n.toFixed(2)}%`;
}

function formatCentsField(value: unknown): string {
  if (value === null || value === undefined) return chalk.dim("—");
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isNaN(n) ? chalk.dim("—") : `${n.toFixed(2)}¢`;
}

function colorInterpretation(value: string | undefined): string {
  if (!value || value === "no_trades") return chalk.dim("—");
  if (value === "buy_pressure") return chalk.green(value);
  if (value === "sell_pressure") return chalk.red(value);
  return chalk.yellow(value);
}

function colorDirection(value: string): string {
  if (value === "up") return chalk.green("↑ up");
  if (value === "down") return chalk.red("↓ down");
  if (value === "flat") return chalk.yellow("→ flat");
  return chalk.dim(value);
}
