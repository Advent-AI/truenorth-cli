import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";

export function registerSearchCommand(program: Command): void {
  // ── perf (performance_scanner) ──
  const perf = program
    .command("perf")
    .description("Token performance scanner")
    .option("--top <n>", "Number of top tokens");

  addJsonOption(perf);

  perf.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = {};
      if (opts.top) args.top = parseInt(opts.top as string, 10);

      const spinner = startSpinner("Scanning performance…");
      const result = await executeTool("performance_scanner", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Performance Scanner ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // ── unlock (token_unlock) ──
  const unlock = program
    .command("unlock <token>")
    .description("Token unlock schedule");

  addJsonOption(unlock);

  unlock.action(
    wrapAction(async (token: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = { token: token as string };

      const spinner = startSpinner(`Fetching unlock schedule for ${chalk.cyan(token as string)}…`);
      const result = await executeTool("token_unlock", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Token Unlock: ${chalk.cyan(token as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // ── ner (ner_detection) ──
  const ner = program
    .command("ner <text>")
    .description("Named entity recognition for crypto text");

  addJsonOption(ner);

  ner.action(
    wrapAction(async (text: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = { text: text as string };

      const spinner = startSpinner("Detecting entities…");
      const result = await executeTool("ner_detection", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  NER Detection ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
