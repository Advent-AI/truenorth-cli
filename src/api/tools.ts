import { listTools as fetchTools, callTool as fetchCallTool } from "./client.js";
import type { ToolInfo, CallToolResult } from "../types.js";

export async function getToolList(): Promise<ToolInfo[]> {
  const res = await fetchTools();
  if (!res.ok || !res.data) {
    throw new Error(res.error ?? "Failed to fetch tools");
  }
  if (res.data.failed || !res.data.success) {
    throw new Error(res.data.message ?? "API returned failure");
  }
  return res.data.data.tools;
}

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const res = await fetchCallTool(toolName, args);
  if (!res.ok || !res.data) {
    throw new Error(res.error ?? "Failed to call tool");
  }
  if (res.data.failed || !res.data.success) {
    throw new Error(res.data.message ?? "API returned failure");
  }
  if (res.data.data.isError) {
    throw new Error(`Tool error: ${JSON.stringify(res.data.data.result)}`);
  }
  return res.data.data;
}
