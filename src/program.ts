import { Command } from "commander";
import { ensureApiKey } from "./auth.js";
import { registerBatchCommand } from "./commands/batch.js";
import { registerCallCommand } from "./commands/call.js";
import { registerLoginCommand } from "./commands/login.js";
import { registerLogoutCommand } from "./commands/logout.js";
import { registerToolsCommand } from "./commands/tools.js";
import { wrapAction } from "./utils.js";

// These manage the saved key themselves; every other command needs a key before it runs.
const KEY_COMMANDS = new Set(["login", "logout"]);

export function createProgram(): Command {
  const program = new Command()
    .name("tn")
    .description("TrueNorth CLI — dynamically discover and call agent tools")
    .version("2.0.0")
    .hook(
      "preAction",
      wrapAction(async (_program: unknown, actionCommand: unknown) => {
        if (!KEY_COMMANDS.has((actionCommand as Command).name())) {
          await ensureApiKey();
        }
      }),
    );

  registerToolsCommand(program);
  registerCallCommand(program);
  registerBatchCommand(program);
  registerLoginCommand(program);
  registerLogoutCommand(program);
  return program;
}
