import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";

export function registerDefiCommand(program: Command): void {
  const defi = program
    .command("defi")
    .description("DeFi protocol and chain analysis");

  // ── defi protocols ──
  const protocols = defi.command("protocols").description("Query DeFi protocols").option("--sort <field>", "Sort by field (e.g. tvl_growth)");
  addJsonOption(protocols);
  protocols.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = {};
      if (opts.sort) args.sort = opts.sort;

      const spinner = startSpinner("Querying protocols…");
      const result = await executeTool("query_protocols", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  DeFi Protocols ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // ── defi chains ──
  const chains = defi.command("chains").description("Query blockchain chains").option("--sort <field>", "Sort by field (e.g. fees_growth)");
  addJsonOption(chains);
  chains.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = {};
      if (opts.sort) args.sort = opts.sort;

      const spinner = startSpinner("Querying chains…");
      const result = await executeTool("query_chains", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Blockchain Chains ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
