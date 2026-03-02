import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";
import { loadConfig } from "../config.js";

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
        token_address: (opts.tokenAddress as string) ?? (token as string),
        timeframe: (opts.timeframe as string) ?? config.defaultTimeframe,
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
        token_address: token as string,
        timeframe: (opts.timeframe as string) ?? config.defaultTimeframe,
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
