import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";

export function registerDerivativesCommand(program: Command): void {
  const cmd = program
    .command("deriv <token>")
    .description("Derivatives analysis for a token")
    .option("--token-address <addr>", "Token address (overrides positional)");

  addJsonOption(cmd);

  cmd.action(
    wrapAction(async (token: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = {
        token_address: (opts.tokenAddress as string) ?? (token as string),
      };

      const spinner = startSpinner(`Fetching derivatives for ${chalk.cyan(args.token_address as string)}…`);
      const result = await executeTool("derivatives_analysis", args);
      spinner.stop();

      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }

      console.log(chalk.bold(`\n  Derivatives Analysis: ${chalk.cyan(args.token_address as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
