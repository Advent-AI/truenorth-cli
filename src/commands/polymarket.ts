import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";

export function registerPolymarketCommand(program: Command): void {
  const cmd = program
    .command("polymarket [query]")
    .description("Polymarket prediction market insights")
    .option("--type <type>", "Market type filter (e.g. crypto)")
    .option("--token <token>", "Token to filter by");

  addJsonOption(cmd);

  cmd.action(
    wrapAction(async (query: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = {};
      if (query) args.query = query as string;
      if (opts.type) args.type = opts.type;
      if (opts.token) args.token = opts.token;

      const spinner = startSpinner("Fetching Polymarket insights…");
      const result = await executeTool("polymarket_insight", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Polymarket Insights ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
