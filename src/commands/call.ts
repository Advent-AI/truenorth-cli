import { Command } from "commander";
import chalk from "chalk";
import { executeTool, getToolList } from "../api/tools.js";
import {
  startSpinner,
  formatResult,
  formatDuration,
  printJson,
  isJsonMode,
  wrapAction,
  parseDynamicArgs,
  addJsonOption,
} from "../utils.js";
import { isAppOnly, printAppOnlyMessage } from "./app-only.js";

export function registerCallCommand(program: Command): void {
  const cmd = program
    .command("call <tool>")
    .description("Call any tool by name with dynamic arguments")
    .allowUnknownOption(true)
    .helpOption("-h, --help", "Show help (use `tn tools --verbose` to see tool params)");

  addJsonOption(cmd);

  cmd.action(
    wrapAction(async (toolName: unknown, _opts: unknown, command: unknown) => {
      const opts = (command as Command).opts() as Record<string, unknown>;
      const rawArgs = (command as Command).args.slice(1); // skip tool name
      const dynamicArgs = parseDynamicArgs(rawArgs);

      if (isAppOnly(toolName as string)) {
        printAppOnlyMessage(toolName as string, isJsonMode(opts));
        return;
      }

      const spinner = startSpinner(`Calling ${chalk.cyan(toolName as string)}…`);
      const result = await executeTool(toolName as string, dynamicArgs);
      spinner.stop();

      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }

      console.log(chalk.bold(`\n  ${chalk.cyan(result.toolName)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
