import { Command } from "commander";
import { registerBatchCommand } from "./commands/batch.js";
import { registerCallCommand } from "./commands/call.js";
import { registerToolsCommand } from "./commands/tools.js";

export function createProgram(): Command {
  const program = new Command()
    .name("tn")
    .description("TrueNorth CLI — dynamically discover and call agent tools")
    .version("1.0.0");

  registerToolsCommand(program);
  registerCallCommand(program);
  registerBatchCommand(program);
  return program;
}
