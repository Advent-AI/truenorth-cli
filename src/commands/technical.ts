import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";
import { loadConfig } from "../config.js";

const VALID_TIMEFRAMES = new Set(["5m", "15m", "1h", "4h", "1d"]);

const TIMEFRAME_ALIASES: Record<string, string> = {
  hourly: "1h",
  daily: "1d",
  weekly: "1w",
  monthly: "1M",
  "4hour": "4h",
  "15min": "15m",
  "5min": "5m",
};

function normalizeTimeframe(tf: string): string {
  if (!tf || !tf.trim()) throw new Error("Timeframe is required");
  const lower = tf.toLowerCase();
  if (TIMEFRAME_ALIASES[lower]) return TIMEFRAME_ALIASES[lower];
  if (VALID_TIMEFRAMES.has(tf)) return tf;
  const aliasList = Object.entries(TIMEFRAME_ALIASES).map(([k, v]) => `${k}→${v}`).join(", ");
  throw new Error(
    `Invalid timeframe "${tf}". Valid values: ${[...VALID_TIMEFRAMES].join(", ")}. ` +
    `Aliases: ${aliasList}`,
  );
}

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  MATIC: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  ATOM: "cosmos",
  LTC: "litecoin",
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  SUI: "sui",
  APT: "aptos",
  OP: "optimism",
  ARB: "arbitrum",
  NEAR: "near",
  TRX: "tron",
  TON: "the-open-network",
  PEPE: "pepe",
  WIF: "dogwifcoin",
  BONK: "bonk",
};

function normalizeTokenAddress(input: string): string {
  const upper = input.toUpperCase();
  // Only map known symbols; preserve original casing for everything else
  // (e.g. checksummed EVM addresses must not be lowercased)
  return SYMBOL_TO_COINGECKO_ID[upper] ?? input;
}

async function runAnalysis(
  toolName: string,
  label: string,
  tokenAddress: string,
  timeframe: string,
  opts: Record<string, unknown>,
): Promise<void> {
  const args: Record<string, string> = { token_address: tokenAddress, timeframe };
  const spinner = startSpinner(`${label} ${chalk.cyan(tokenAddress)}…`);
  const result = await executeTool(toolName, args);
  spinner.stop();

  if (isJsonMode(opts)) {
    printJson(result);
    return;
  }

  console.log(chalk.bold(`\n  ${label}: ${chalk.cyan(tokenAddress)} ${formatDuration(result.durationMs)}\n`));
  formatResult(result.result);
  console.log();
}

export function registerTechnicalCommand(program: Command): void {
  const cmd = program
    .command("ta <token>")
    .description("Technical analysis for a token")
    .option("--timeframe <tf>", "Timeframe (e.g. 1h, 4h, 1d)")
    .option("--token-address <addr>", "Token address (overrides positional)");

  addJsonOption(cmd);

  cmd.action(
    wrapAction(async (token: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const config = loadConfig();
      const tokenAddress = normalizeTokenAddress((opts.tokenAddress as string) ?? (token as string));
      const timeframe = normalizeTimeframe((opts.timeframe as string) ?? config.defaultTimeframe);
      await runAnalysis("technical_analysis", "Technical Analysis", tokenAddress, timeframe, opts);
    }),
  );

  // kline command
  const klineCmd = program
    .command("kline <token>")
    .description("Kline/candlestick analysis for a token")
    .option("--timeframe <tf>", "Timeframe (e.g. 1h, 4h, 1d)")
    .option("--token-address <addr>", "Token address (overrides positional)");

  addJsonOption(klineCmd);

  klineCmd.action(
    wrapAction(async (token: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const config = loadConfig();
      const tokenAddress = normalizeTokenAddress((opts.tokenAddress as string) ?? (token as string));
      const timeframe = normalizeTimeframe((opts.timeframe as string) ?? config.defaultTimeframe);
      await runAnalysis("kline_analysis", "Kline Analysis", tokenAddress, timeframe, opts);
    }),
  );
}
