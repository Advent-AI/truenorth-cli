import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";

export function registerPerpsCommand(program: Command): void {
  const cmd = program
    .command("risk")
    .description("Liquidation risk analysis")
    .option("--token <token>", "Token name")
    .option("--dir <direction>", "Position direction (long/short)")
    .option("--price <price>", "Entry price")
    .option("--liq <price>", "Liquidation price");

  addJsonOption(cmd);

  cmd.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = {};
      if (opts.token) args.token = opts.token;
      if (opts.dir) args.direction = opts.dir;
      if (opts.price) args.entry_price = parseFloat(opts.price as string);
      if (opts.liq) args.liquidation_price = parseFloat(opts.liq as string);

      const spinner = startSpinner("Analyzing liquidation risk…");
      const result = await executeTool("liquidation_risk", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Liquidation Risk ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
