import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";
import { loadConfig } from "../config.js";

export function registerMemeCommand(program: Command): void {
  const meme = program
    .command("meme")
    .description("Meme token analysis suite");

  // ── meme discover ──
  const discover = meme.command("discover").description("Discover meme tokens").option("--limit <n>", "Number of results");
  addJsonOption(discover);
  discover.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const config = loadConfig();
      const args: Record<string, unknown> = {};
      if (opts.limit) args.limit = parseInt(opts.limit as string, 10);
      else args.limit = config.defaultLimit;

      const spinner = startSpinner("Discovering meme tokens…");
      const result = await executeTool("meme_discovery", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Meme Discovery ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // ── meme safety ──
  const safety = meme.command("safety <address>").description("Meme project safeguards check").option("--network-id <net>", "Network ID (e.g. solana, ethereum)");
  addJsonOption(safety);
  safety.action(
    wrapAction(async (address: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = { token_address: address as string };
      if (opts.networkId) args.network_id = opts.networkId;

      const spinner = startSpinner(`Checking safeguards for ${chalk.cyan(address as string)}…`);
      const result = await executeTool("meme_project_safeguards", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Meme Safety: ${chalk.cyan(address as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // ── meme pulse ──
  const pulse = meme.command("pulse <address>").description("Meme market pulse").option("--network-id <net>", "Network ID");
  addJsonOption(pulse);
  pulse.action(
    wrapAction(async (address: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = { token_address: address as string };
      if (opts.networkId) args.network_id = opts.networkId;

      const spinner = startSpinner(`Fetching market pulse for ${chalk.cyan(address as string)}…`);
      const result = await executeTool("meme_market_pulse", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Meme Market Pulse: ${chalk.cyan(address as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // ── meme social ──
  const social = meme.command("social <address>").description("Meme social momentum").option("--network-id <net>", "Network ID");
  addJsonOption(social);
  social.action(
    wrapAction(async (address: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = { token_address: address as string };
      if (opts.networkId) args.network_id = opts.networkId;

      const spinner = startSpinner(`Analyzing social momentum for ${chalk.cyan(address as string)}…`);
      const result = await executeTool("meme_social_momentum", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Meme Social Momentum: ${chalk.cyan(address as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // ── meme narrative ──
  const narrative = meme.command("narrative <address>").description("Meme token narrative analysis").option("--network-id <net>", "Network ID");
  addJsonOption(narrative);
  narrative.action(
    wrapAction(async (address: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = { token_address: address as string };
      if (opts.networkId) args.network_id = opts.networkId;

      const spinner = startSpinner(`Analyzing narrative for ${chalk.cyan(address as string)}…`);
      const result = await executeTool("meme_token_narrative", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Meme Token Narrative: ${chalk.cyan(address as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
