import { readFileSync } from "node:fs";
import { Command } from "commander";
import chalk from "chalk";
import { batchCallTools } from "../api/client.js";
import type { BatchToolCall } from "../types.js";
import {
  formatDuration,
  formatResult,
  isJsonMode,
  printJson,
  startSpinner,
  wrapAction,
} from "../utils.js";

interface BatchInput {
  tool: string;
  args?: Record<string, unknown>;
}

export function registerBatchCommand(program: Command): void {
  const cmd = program
    .command("batch [payload]")
    .description("Execute multiple tool calls in one HTTP request")
    .option("-f, --file <path>", "Read the JSON array from this file")
    .option("--json", "Output the raw result array as JSON");

  cmd.action(
    wrapAction(async (payload: unknown, _opts: unknown, command: unknown) => {
      const opts = (command as Command).opts() as Record<string, unknown>;
      const payloadValue = typeof payload === "string" ? payload : undefined;
      const filePath = typeof opts.file === "string" ? opts.file : undefined;
      if ((payloadValue === undefined) === (filePath === undefined)) {
        throw new Error("Provide exactly one of: a JSON-array positional argument or -f/--file.");
      }

      const raw = filePath ? readFileSync(filePath, "utf-8") : payloadValue!;
      const inputs = parseBatchInputs(raw);
      const calls: BatchToolCall[] = inputs.map((input) => ({
        toolName: input.tool,
        arguments: input.args ?? {},
      }));

      const spinner = startSpinner(`Calling ${calls.length} tools…`);
      const response = await batchCallTools(calls);
      spinner.stop();

      if (!response.ok || !response.data) {
        throw new Error(response.error ?? "Batch call failed");
      }
      if (response.data.failed || !response.data.success) {
        throw new Error(response.data.message ?? "API returned failure");
      }

      const results = response.data.data.results;
      if (isJsonMode(opts)) {
        printJson(results);
        return;
      }

      results.forEach((result, index) => {
        const marker = result.isError ? chalk.red("ERROR") : chalk.green("OK");
        console.log(
          chalk.bold(
            `\n${index}. ${chalk.cyan(result.toolName)} ${formatDuration(result.durationMs)} ${marker}\n`,
          ),
        );
        formatResult(result.result);
      });
      console.log();
    }),
  );
}

function parseBatchInputs(raw: string): BatchInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON: ${message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Expected a JSON array of {tool, args} objects.");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`Entry [${index}] is not an object.`);
    }
    const input = entry as Record<string, unknown>;
    if (typeof input.tool !== "string" || !input.tool) {
      throw new Error(`Entry [${index}] is missing required key 'tool'.`);
    }
    if (
      input.args !== undefined
      && (!input.args || typeof input.args !== "object" || Array.isArray(input.args))
    ) {
      throw new Error(`Entry [${index}] 'args' must be an object.`);
    }
    return {
      tool: input.tool,
      args: input.args as Record<string, unknown> | undefined,
    };
  });
}
