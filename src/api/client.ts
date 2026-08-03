import { getBaseUrl } from "../config.js";
import type {
  ApiResponse,
  BatchToolApiResponse,
  BatchToolCall,
  CallToolApiResponse,
  ListToolsApiResponse,
} from "../types.js";

async function request<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...init?.headers as Record<string, string>,
    };

    const res = await fetch(url, {
      ...init,
      headers,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${body || res.statusText}`, status: res.status };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

export async function listTools(): Promise<ApiResponse<ListToolsApiResponse>> {
  const baseUrl = getBaseUrl();
  return request<ListToolsApiResponse>(baseUrl);
}

export async function callTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<ApiResponse<CallToolApiResponse>> {
  const baseUrl = getBaseUrl();
  return request<CallToolApiResponse>(`${baseUrl}/call`, {
    method: "POST",
    body: JSON.stringify({ toolName, arguments: args }),
  });
}

export async function batchCallTools(
  calls: BatchToolCall[],
): Promise<ApiResponse<BatchToolApiResponse>> {
  const baseUrl = getBaseUrl();
  return request<BatchToolApiResponse>(`${baseUrl}/batch`, {
    method: "POST",
    body: JSON.stringify({ calls }),
  });
}
