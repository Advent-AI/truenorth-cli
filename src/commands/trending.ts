import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";
import { loadConfig } from "../config.js";

export function registerTrendingCommand(program: Command): void {
  const cmd = program
    .command("trending")
    .description("Discover trending tokens")
    .option("--limit <n>", "Number of results");

  addJsonOption(cmd);

  cmd.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const config = loadConfig();
      const args: Record<string, unknown> = {};
      if (opts.limit) args.limit = parseInt(opts.limit as string, 10);
      else args.limit = config.defaultLimit;

      const spinner = startSpinner("Discovering trending tokens…");
      const result = await executeTool("trending_discovery", args);
      spinner.stop();

      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }

      console.log(chalk.bold(`\n  Trending Tokens ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
