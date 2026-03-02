import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";

export function registerMarketInfoCommand(program: Command): void {
  const cmd = program
    .command("info <token>")
    .description("Basic market info (ATH, market cap, supply, price)")
    .option("--token-address <addr>", "Token address (overrides positional)");

  addJsonOption(cmd);

  cmd.action(
    wrapAction(async (token: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = {
        token_address: (opts.tokenAddress as string) ?? (token as string),
      };

      const spinner = startSpinner(`Fetching market info for ${chalk.cyan(args.token_address as string)}…`);
      const result = await executeTool("basic_market_info", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Market Info: ${chalk.cyan(args.token_address as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
