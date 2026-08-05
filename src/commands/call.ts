import { Command } from "commander";
import chalk from "chalk";
import { readFileSync } from "node:fs";
import { executeTool } from "../api/tools.js";
import {
  startSpinner,
  formatResult,
  formatDuration,
  printJson,
  isJsonMode,
  wrapAction,
  parseDynamicArgs,
} from "../utils.js";

export function registerCallCommand(program: Command): void {
  const cmd = program
    .command("call <tool>")
    .description("Call any tool by name with dynamic arguments")
    .allowUnknownOption(true)
    .helpOption("-h, --help", "Show help (use `tn tools --schema` to see tool params)")
    .option("-f, --file <path>", "Read one JSON argument object from this file")
    .option("--json", "Output the raw API envelope")
    .option("--result", "Output only the tool result as JSON");

  cmd.action(
    wrapAction(async (toolName: unknown, _opts: unknown, command: unknown) => {
      const parsedCommand = command as Command;
      const opts = parsedCommand.opts() as Record<string, unknown>;
      // Commander keeps the required <tool> positional at args[0].
      const [, ...rawArgs] = parsedCommand.args;
      if (opts.json && opts.result) {
        throw new Error("Use either --json (full envelope) or --result (payload only), not both.");
      }
      if (opts.file && rawArgs.length > 0) {
        throw new Error("Do not combine -f/--file with dynamic tool arguments.");
      }
      const dynamicArgs = opts.file
        ? loadArguments(String(opts.file))
        : parseDynamicArgs(rawArgs);

      const spinner = startSpinner(`Calling ${chalk.cyan(toolName as string)}…`);
      const result = await executeTool(toolName as string, dynamicArgs);
      spinner.stop();

      if (isJsonMode(opts) || opts.result) {
        printJson(opts.result ? result.result : result);
        return;
      }

      console.log(chalk.bold(`\n  ${chalk.cyan(result.toolName)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}

function loadArguments(path: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf-8"));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON argument file: ${message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected one JSON object containing the tool arguments.");
  }
  return parsed as Record<string, unknown>;
}
