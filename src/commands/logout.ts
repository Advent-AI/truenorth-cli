import { Command } from "commander";
import chalk from "chalk";
import { CONFIG_FILE, removeApiKey } from "../config.js";
import { wrapAction } from "../utils.js";

export function registerLogoutCommand(program: Command): void {
  program
    .command("logout")
    .description("Remove the saved TrueNorth API key")
    .action(
      wrapAction(async () => {
        console.log(
          removeApiKey()
            ? chalk.green(`Removed the API key from ${CONFIG_FILE}.`)
            : `No API key is saved in ${CONFIG_FILE}.`,
        );
        if (process.env.TN_API_KEY?.trim()) {
          console.log(chalk.yellow("TN_API_KEY is still set in this shell, and commands here keep using it."));
        }
      }),
    );
}
