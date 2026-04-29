import { Command } from "commander";
import chalk from "chalk";
import { select, input } from "@inquirer/prompts";
import { loadConfig, saveConfig } from "./config.js";
import { registerToolsCommand } from "./commands/tools.js";
import { registerCallCommand } from "./commands/call.js";
import { registerTechnicalCommand } from "./commands/technical.js";
import { registerMarketInfoCommand } from "./commands/market-info.js";
import { registerDerivativesCommand } from "./commands/derivatives.js";
import { registerEventsCommand } from "./commands/events.js";
import { registerPerpsCommand } from "./commands/perps.js";
import { registerDefiCommand } from "./commands/defi.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerOptionsCommand } from "./commands/options.js";
import { registerAppOnlyCommands } from "./commands/app-only.js";

const program = new Command();

program
  .name("tn")
  .description("TrueNorth CLI — crypto market intelligence in your terminal")
  .version("0.5.1");

// Register all commands
registerToolsCommand(program);
registerCallCommand(program);
registerTechnicalCommand(program);
registerMarketInfoCommand(program);
registerDerivativesCommand(program);
registerEventsCommand(program);
registerPerpsCommand(program);
registerDefiCommand(program);
registerSearchCommand(program);
registerOptionsCommand(program);
registerAppOnlyCommands(program);

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
