import { Command } from "commander";
import chalk from "chalk";
import { getToolList } from "../api/tools.js";
import type { ToolInfo } from "../types.js";
import { startSpinner, makeTable, truncate, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";

export function registerToolsCommand(program: Command): void {
  const cmd = program
    .command("tools")
    .description("List all available analysis tools")
    .option("--schema", "Include input and output schemas")
    .option("--filter <keyword>", "Filter tools by name or description")
    .option("--names <names>", "Comma-separated exact tool names to return");

  addJsonOption(cmd);

  cmd.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const spinner = startSpinner("Fetching tools…");
      let tools = await getToolList();
      spinner.stop();

      if (opts.names) {
        const names = new Set(
          String(opts.names)
            .split(",")
            .map((name) => name.trim().toLowerCase())
            .filter(Boolean),
        );
        tools = tools.filter((tool) => names.has(tool.name.toLowerCase()));
      }

      let filtered = tools;
      if (opts.filter) {
        const kw = String(opts.filter).toLowerCase();
        filtered = tools.filter(
          (t) => t.name.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw),
        );
      }

      if (isJsonMode(opts)) {
        const payload = filtered.map((tool) => (
          opts.schema
            ? {
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema,
                output_schema: tool.outputSchema ?? null,
              }
            : { name: tool.name, description: tool.description }
        ));
        printJson({ tools: payload });
        return;
      }

      if (filtered.length === 0) {
        console.log(chalk.yellow("No tools found."));
        return;
      }

      console.log(chalk.bold(`\n  Available Tools (${filtered.length})\n`));

      if (opts.schema) {
        const rows = filtered.map((tool) => {
          const props = tool.inputSchema.properties ?? {};
          const required = tool.inputSchema.required ?? [];
          const parameters = Object.entries(props).map(([name, info]) => {
            const marker = required.includes(name) ? "*" : "";
            return `${marker}${name}:${info.type ?? "any"}`;
          });
          return [
            chalk.yellow(tool.name),
            truncate(tool.description, 60),
            parameters.join(", ") || "-",
          ];
        });
        console.log(makeTable(["Tool", "Description", "Input"], rows));
      } else {
        const rows = filtered.map((t) => [
          chalk.yellow(t.name),
          truncate(t.description, 80),
        ]);
        console.log(makeTable(["Tool", "Description"], rows));
      }
    }),
  );
}
