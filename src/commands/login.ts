import { Command } from "commander";
import chalk from "chalk";
import { setUpApiKey, terminalIo } from "../auth.js";
import { wrapAction } from "../utils.js";

export function registerLoginCommand(program: Command): void {
  program
    .command("login")
    .description("Save your TrueNorth API key after checking it with the API")
    .action(
      wrapAction(async () => {
        if (!terminalIo.interactive) {
          throw new Error("`tn login` needs a terminal. In scripts, set TN_API_KEY instead.");
        }
        await setUpApiKey();
        if (process.env.TN_API_KEY?.trim()) {
          terminalIo.say(chalk.yellow("TN_API_KEY is set in this shell, so commands here keep using it instead."));
        }
      }),
    );
}
