import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";
import { loadConfig } from "../config.js";

export function registerKolCommand(program: Command): void {
  const kol = program
    .command("kol")
    .description("KOL (Key Opinion Leader) tracking");

  // ── kol leaderboard ──
  const leaderboard = kol.command("leaderboard").description("KOL leaderboard").option("--limit <n>", "Number of results");
  addJsonOption(leaderboard);
  leaderboard.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const config = loadConfig();
      const args: Record<string, unknown> = {};
      if (opts.limit) args.limit = parseInt(opts.limit as string, 10);
      else args.limit = config.defaultLimit;

      const spinner = startSpinner("Fetching KOL leaderboard…");
      const result = await executeTool("kol_leaderboard", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  KOL Leaderboard ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // ── kol performance ──
  const performance = kol.command("performance <handle>").description("KOL performance analysis");
  addJsonOption(performance);
  performance.action(
    wrapAction(async (handle: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = { handle: handle as string };

      const spinner = startSpinner(`Analyzing ${chalk.cyan(handle as string)}…`);
      const result = await executeTool("kol_performance", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  KOL Performance: ${chalk.cyan(handle as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // ── kol search ──
  const search = kol.command("search <query>").description("Search KOL insights");
  addJsonOption(search);
  search.action(
    wrapAction(async (query: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = { query: query as string };

      const spinner = startSpinner(`Searching KOL insights for "${chalk.cyan(query as string)}"…`);
      const result = await executeTool("kol_rag_search", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  KOL Search: "${chalk.cyan(query as string)}" ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
