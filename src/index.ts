import { Command } from "commander";
import chalk from "chalk";
import { select, input } from "@inquirer/prompts";
import { loadConfig, saveConfig } from "./config.js";
import { registerToolsCommand } from "./commands/tools.js";
import { registerCallCommand } from "./commands/call.js";
import { registerTechnicalCommand } from "./commands/technical.js";
import { registerDerivativesCommand } from "./commands/derivatives.js";
import { registerEventsCommand } from "./commands/events.js";
import { registerTrendingCommand } from "./commands/trending.js";
import { registerMemeCommand } from "./commands/meme.js";
import { registerPerpsCommand } from "./commands/perps.js";
import { registerPolymarketCommand } from "./commands/polymarket.js";
import { registerKolCommand } from "./commands/kol.js";
import { registerDefiCommand } from "./commands/defi.js";
import { registerScanCommand } from "./commands/scan.js";
import { registerSearchCommand } from "./commands/search.js";

const program = new Command();

program
  .name("tn")
  .description("TrueNorth CLI — crypto analysis tools in your terminal")
  .version("0.1.0");

// Register all commands
registerToolsCommand(program);
registerCallCommand(program);
registerTechnicalCommand(program);
registerDerivativesCommand(program);
registerEventsCommand(program);
registerTrendingCommand(program);
registerMemeCommand(program);
registerPerpsCommand(program);
registerPolymarketCommand(program);
registerKolCommand(program);
registerDefiCommand(program);
registerScanCommand(program);
registerSearchCommand(program);

// ── config command ───────────────────────────────────────────────────
program
  .command("config")
  .description("Configure CLI settings")
  .action(async () => {
    const config = loadConfig();

    const action = await select({
      message: "What would you like to configure?",
      choices: [
        { name: `API Base URL (${chalk.dim(config.baseUrl)})`, value: "baseUrl" },
        { name: `Default Timeframe (${chalk.dim(config.defaultTimeframe)})`, value: "defaultTimeframe" },
        { name: `Default Limit (${chalk.dim(String(config.defaultLimit))})`, value: "defaultLimit" },
        { name: "Exit", value: "exit" },
      ],
    });

    if (action === "exit") return;

    if (action === "baseUrl") {
      const value = await input({ message: "API Base URL:", default: config.baseUrl });
      saveConfig({ baseUrl: value });
      console.log(chalk.green("Updated baseUrl."));
    } else if (action === "defaultTimeframe") {
      const value = await select({
        message: "Default timeframe:",
        choices: [
          { name: "1h", value: "1h" },
          { name: "4h", value: "4h" },
          { name: "1d", value: "1d" },
          { name: "1w", value: "1w" },
        ],
      });
      saveConfig({ defaultTimeframe: value });
      console.log(chalk.green("Updated defaultTimeframe."));
    } else if (action === "defaultLimit") {
      const value = await input({ message: "Default limit:", default: String(config.defaultLimit) });
      saveConfig({ defaultLimit: parseInt(value, 10) });
      console.log(chalk.green("Updated defaultLimit."));
    }
  });

program.parse();
