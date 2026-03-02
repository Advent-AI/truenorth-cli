import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";

export function registerEventsCommand(program: Command): void {
  const cmd = program
    .command("events <query>")
    .description("Search crypto news and events")
    .option("--time-window <window>", "Time window (e.g. 1d, 7d, 30d)", "7d");

  addJsonOption(cmd);

  cmd.action(
    wrapAction(async (query: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = {
        query: query as string,
        time_window: opts.timeWindow as string,
      };

      const spinner = startSpinner(`Searching events for "${chalk.cyan(query as string)}"…`);
      const result = await executeTool("events", args);
      spinner.stop();

      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }

      console.log(chalk.bold(`\n  Events: "${chalk.cyan(query as string)}" ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
