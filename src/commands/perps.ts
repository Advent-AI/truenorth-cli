import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import { startSpinner, formatResult, formatDuration, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";

export function registerPerpsCommand(program: Command): void {
  const perps = program
    .command("perps")
    .description("Hyperliquid perpetuals tools");

  // ── perps positions ──
  const positions = perps.command("positions").description("Get Hyperliquid positions").option("--address <addr>", "Wallet address");
  addJsonOption(positions);
  positions.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = {};
      if (opts.address) args.address = opts.address;

      const spinner = startSpinner("Fetching positions…");
      const result = await executeTool("get_my_hyperliquid_positions", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Hyperliquid Positions ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // ── perps smart-money ──
  const smartMoney = perps.command("smart-money <token>").description("Smart money analysis on Hyperliquid");
  addJsonOption(smartMoney);
  smartMoney.action(
    wrapAction(async (token: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = { token_address: token as string };

      const spinner = startSpinner(`Analyzing smart money for ${chalk.cyan(token as string)}…`);
      const result = await executeTool("hyperliquid_smart_money", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Smart Money: ${chalk.cyan(token as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );

  // ── perps risk ──
  const risk = perps
    .command("risk")
    .description("Liquidation risk analysis")
    .option("--token <token>", "Token name")
    .option("--dir <direction>", "Position direction (long/short)")
    .option("--price <price>", "Entry price")
    .option("--liq <price>", "Liquidation price");
  addJsonOption(risk);
  risk.action(
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

  // ── perps playbook ──
  const playbook = perps.command("playbook <address>").description("Trading playbook analysis");
  addJsonOption(playbook);
  playbook.action(
    wrapAction(async (address: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = { address: address as string };

      const spinner = startSpinner(`Analyzing playbook for ${chalk.cyan(address as string)}…`);
      const result = await executeTool("trading_playbook_analysis", args);
      spinner.stop();

      if (isJsonMode(opts)) { printJson(result); return; }
      console.log(chalk.bold(`\n  Trading Playbook: ${chalk.cyan(address as string)} ${formatDuration(result.durationMs)}\n`));
      formatResult(result.result);
      console.log();
    }),
  );
}
