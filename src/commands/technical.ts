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
  const lower = tf.toLowerCase();
  if (TIMEFRAME_ALIASES[lower]) return TIMEFRAME_ALIASES[lower];
  if (VALID_TIMEFRAMES.has(tf)) return tf;
  throw new Error(
    `Invalid timeframe "${tf}". Valid values: ${[...VALID_TIMEFRAMES].join(", ")}. ` +
    `Aliases: daily→1d, hourly→1h, weekly→1w, monthly→1M`,
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
  return SYMBOL_TO_COINGECKO_ID[upper] ?? input.toLowerCase();
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
      const args: Record<string, unknown> = {
        token_address: normalizeTokenAddress((opts.tokenAddress as string) ?? (token as string)),
        timeframe: normalizeTimeframe((opts.timeframe as string) ?? config.defaultTimeframe),
      };

      const spinner = startSpinner(`Analyzing ${chalk.cyan(args.token_address as string)}…`);
      const result = await executeTool("technical_analysis", args);
      spinner.stop();

      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }

      console.log(chalk.bold(`\n  Technical Analysis: ${chalk.cyan(args.token_address as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // kline command
  const klineCmd = program
    .command("kline <token>")
    .description("Kline/candlestick analysis for a token")
    .option("--timeframe <tf>", "Timeframe (e.g. 1h, 4h, 1d)");

  addJsonOption(klineCmd);

  klineCmd.action(
    wrapAction(async (token: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const config = loadConfig();
      const args: Record<string, unknown> = {
        token_address: normalizeTokenAddress(token as string),
        timeframe: normalizeTimeframe((opts.timeframe as string) ?? config.defaultTimeframe),
      };

      const spinner = startSpinner(`Fetching kline for ${chalk.cyan(token as string)}…`);
      const result = await executeTool("kline_analysis", args);
      spinner.stop();

      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }

      console.log(chalk.bold(`\n  Kline Analysis: ${chalk.cyan(token as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
