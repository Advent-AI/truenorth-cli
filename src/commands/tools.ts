import { Command } from "commander";
import chalk from "chalk";
import { getToolList } from "../api/tools.js";
import type { ToolInfo } from "../types.js";
import { startSpinner, makeTable, truncate, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";

function getParamCount(tool: ToolInfo): number {
  return Object.keys(tool.inputSchema.properties ?? {}).length;
}

export function registerToolsCommand(program: Command): void {
  const cmd = program
    .command("tools")
    .description("List all available analysis tools")
    .option("--verbose", "Show full descriptions and input schemas")
    .option("--filter <keyword>", "Filter tools by name or description");

  addJsonOption(cmd);

  cmd.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const spinner = startSpinner("Fetching tools…");
      const tools = await getToolList();
      spinner.stop();

      let filtered = tools;
      if (opts.filter) {
        const kw = String(opts.filter).toLowerCase();
        filtered = tools.filter(
          (t) => t.name.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw),
        );
      }

      if (isJsonMode(opts)) {
        printJson(filtered);
        return;
      }

      if (filtered.length === 0) {
        console.log(chalk.yellow("No tools found."));
        return;
      }

      console.log(chalk.bold(`\n  Available Tools (${filtered.length})\n`));

      if (opts.verbose) {
        for (const tool of filtered) {
          console.log(chalk.cyan.bold(`  ${tool.name}`));
          console.log(chalk.white(`    ${tool.description}`));
          const props = tool.inputSchema.properties ?? {};
          const required = tool.inputSchema.required ?? [];
          const propKeys = Object.keys(props);
          if (propKeys.length > 0) {
            console.log(chalk.dim("    Parameters:"));
            for (const pName of propKeys) {
              const p = props[pName];
              const isReq = required.includes(pName);
              const req = isReq ? chalk.red("*") : " ";
              const def = p.default !== undefined ? chalk.dim(` (default: ${p.default})`) : "";
              const enums = p.enum ? chalk.dim(` [${p.enum.join(", ")}]`) : "";
              const pType = p.type ?? "any";
              console.log(`      ${req} ${chalk.yellow(pName)} ${chalk.dim(pType)}${def}${enums}`);
              if (p.description) {
                console.log(`        ${chalk.dim(p.description)}`);
              }
            }
          }
          console.log();
        }
      } else {
        const rows = filtered.map((t) => [
          chalk.yellow(t.name),
          truncate(t.description, 60),
          chalk.dim(String(getParamCount(t))),
        ]);
        console.log(makeTable(["Tool", "Description", "Params"], rows));
      }
    }),
  );
}
