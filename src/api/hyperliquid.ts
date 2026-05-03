// Read-only Hyperliquid Info API client for HIP-4 outcome markets.
//
// HIP-4 surface is a public, no-auth POST endpoint at
// https://api.hyperliquid.xyz/info. This module wraps that surface and
// returns results in the same `{ toolName, result, durationMs, isError }`
// envelope that `executeTool()` produces, so existing formatters in
// utils.ts work without changes.
//
// HL spec reference (verbatim, fetched 2026-05-03):
//   - `outcomeMeta` returns active outcome markets
//   - `l2Book` / `recentTrades` / `candleSnapshot` accept HIP-4 asset
//     names as the `coin` parameter using "#<n>" encoding
//   - description is pipe-delimited, e.g.
//     "class:priceBinary|underlying:BTC|expiry:20260504-0600|targetPrice:78213|period:1d"

import type { CallToolResult } from "../types.js";

const HL_INFO_URL = "https://api.hyperliquid.xyz/info";

// ── Asset id encoding (verbatim from HL docs) ─────────────────────────
//   asset_index = 10 * outcomeId + side   (0=YES, 1=NO)
//   coin name   = "#<asset_index>"
//   asset_id    = 100_000_000 + asset_index

export type Side = "yes" | "no";

export function sideIndex(side: Side): number {
  return side === "yes" ? 0 : 1;
}

export function assetName(outcomeId: number, side: Side): string {
  return `#${10 * outcomeId + sideIndex(side)}`;
}

export function assetId(outcomeId: number, side: Side): number {
  return 100_000_000 + 10 * outcomeId + sideIndex(side);
}

// ── Description parser ────────────────────────────────────────────────

export function parseDescription(desc: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of desc.split("|")) {
    const idx = part.indexOf(":");
    if (idx === -1) continue;
    out[part.slice(0, idx)] = part.slice(idx + 1);
  }
  return out;
}

// ── Expiry parser (HL format: "YYYYMMDD-HHMM" UTC) ───────────────────

export function parseExpiry(expiry: string | undefined): number | null {
  if (!expiry) return null;
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(expiry);
  if (!m) return null;
  return Date.UTC(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
  );
}

// ── Lookback string parser (1m, 4h, 1d → milliseconds) ────────────────

export function parseLookback(s: string): number {
  const m = /^(\d+)([mhd])$/.exec(s.trim());
  if (!m) throw new Error(`Invalid lookback: "${s}". Use 1m, 4h, 1d`);
  const n = parseInt(m[1], 10);
  const unit = m[2];
  if (unit === "m") return n * 60_000;
  if (unit === "h") return n * 3_600_000;
  return n * 86_400_000;
}

// ── Low-level POST ────────────────────────────────────────────────────

export async function hlInfo<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(HL_INFO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Hyperliquid Info API: HTTP ${res.status} ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

// ── Envelope wrapper ──────────────────────────────────────────────────

export async function callHip4<T>(
  toolName: string,
  body: Record<string, unknown>,
): Promise<CallToolResult> {
  const start = Date.now();
  try {
    const result = await hlInfo<T>(body);
    return { toolName, result, durationMs: Date.now() - start, isError: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      toolName,
      result: { error: msg },
      durationMs: Date.now() - start,
      isError: true,
    };
  }
}

// ── Typed response shapes ─────────────────────────────────────────────

export interface Outcome {
  outcome: number;
  name: string;
  description: string;
  sideSpecs: { name: string }[];
}

export interface OutcomeMetaResponse {
  outcomes: Outcome[];
  questions: unknown[];
}

export interface L2Level {
  px: string;
  sz: string;
  n: number;
}

export interface L2BookResponse {
  coin: string;
  levels: [L2Level[], L2Level[]]; // [bids, asks]
  time: number;
}

export interface RecentTrade {
  coin: string;
  side: "A" | "B"; // A = ask side hit (taker sold), B = bid side hit (taker bought)
  px: string;
  sz: string;
  time: number;
  hash: string;
  tid: number;
}

export interface Candle {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
}
