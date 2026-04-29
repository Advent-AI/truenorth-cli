import { Command } from "commander";
import chalk from "chalk";
import { getToolList } from "../api/tools.js";
import type { ToolInfo } from "../types.js";
import { startSpinner, makeTable, truncate, printJson, isJsonMode, wrapAction, addJsonOption } from "../utils.js";
import { APP_ONLY_TOOLS, appOnlyAsToolInfo } from "./app-only.js";

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
      const liveTools = await getToolList();
      spinner.stop();

      // App-only registry takes precedence over live API listing — when a
      // tool name appears in both (e.g. equity tools that the API exposes
      // but we route to app.true-north.xyz instead), show only the
      // app-only version so users see the CTA, not the bare schema.
      const appOnlyTools = APP_ONLY_TOOLS.map(appOnlyAsToolInfo);
      const appOnlyNames = new Set(appOnlyTools.map((t) => t.name));
      const filteredLive = liveTools.filter((t) => !appOnlyNames.has(t.name));
      const tools = [...filteredLive, ...appOnlyTools];

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

      const usableCount = filtered.filter((t) => !t.appOnly).length;
      const appOnlyCount = filtered.length - usableCount;
      const header = appOnlyCount > 0
        ? `Available Tools (${filtered.length}) — ${chalk.green(`${usableCount} via CLI`)}, ${chalk.cyan(`${appOnlyCount} in TrueNorth app`)}`
        : `Available Tools (${filtered.length})`;
      console.log(chalk.bold(`\n  ${header}\n`));

      if (opts.verbose) {
        for (const tool of filtered) {
          const badge = tool.appOnly ? chalk.cyan(" [app]") : "";
          console.log(chalk.cyan.bold(`  ${tool.name}`) + badge);
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
          t.appOnly ? chalk.dim(t.name) : chalk.yellow(t.name),
          truncate(t.description, 60),
          t.appOnly ? chalk.cyan("app") : chalk.dim(String(getParamCount(t))),
        ]);
        console.log(makeTable(["Tool", "Description", "Where"], rows));
      }
    }),
  );
}
