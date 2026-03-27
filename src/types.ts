export interface InputSchema {
  type: string;
  properties: Record<string, {
    type: string;
    description?: string;
    default?: unknown;
    title?: string;
    enum?: string[];
    anyOf?: unknown[];
  }>;
  required?: string[];
  title?: string;
  description?: string;
}

export interface ToolInfo {
  name: string;
  description: string;
  inputSchema: InputSchema;
}

// Actual API shape: { data: { tools: [...], totalCount: N }, success: true, ... }
export interface ListToolsApiResponse {
  data: {
    tools: ToolInfo[];
    totalCount: number;
  };
  success: boolean;
  message: string | null;
  code: string | null;
  failed: boolean;
}

export interface CallToolResult {
  toolName: string;
  result: unknown;
  durationMs: number;
  isError: boolean;
}

// Actual API shape: { data: { toolName, result, durationMs, isError }, success: true, ... }
export interface CallToolApiResponse {
  data: CallToolResult;
  success: boolean;
  message: string | null;
  code: string | null;
  failed: boolean;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface TnConfig {
  baseUrl: string;
  defaultTimeframe: string;
  defaultLimit: number;
}

export const DEFAULT_CONFIG: TnConfig = {
  baseUrl: "https://api.adventai.io/api/agent-tools",
  defaultTimeframe: "4h",
  defaultLimit: 20,
};
