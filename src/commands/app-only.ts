import { Command } from "commander";
import chalk from "chalk";
import type { ToolInfo } from "../types.js";
import { addJsonOption, isJsonMode, printJson } from "../utils.js";

// ── App-only registry ────────────────────────────────────────────────
//
// Tools that are *advertised* by the CLI for capability discovery, but whose
// execution is gated to the TrueNorth web app. Calling any of these (either
// via dedicated stub command or `tn call`) prints a CTA pointing users to
// https://app.true-north.xyz/ instead of hitting the public REST API.

export const APP_URL = "https://app.true-north.xyz/";

export interface AppOnlyTool {
  name: string;
  capability: string;
  description: string;
  category: "meme" | "discovery" | "finance";
}

export const APP_ONLY_TOOLS: AppOnlyTool[] = [
  // ── Meme analytics ────────────────────────────────────────────────
  { name: "meme_discovery",          capability: "meme token discovery",     description: "Trending meme tokens",                 category: "meme" },
  { name: "meme_market_pulse",       capability: "meme market pulse",        description: "Meme holder distribution and flow",    category: "meme" },
  { name: "meme_project_safeguards", capability: "meme contract safeguards", description: "Meme contract security checks",        category: "meme" },
  { name: "meme_social_momentum",    capability: "meme social momentum",     description: "Meme social sentiment and momentum",   category: "meme" },
  { name: "meme_token_narrative",    capability: "meme narrative",           description: "Meme token narrative and story arc",   category: "meme" },

  // ── Discovery / content ───────────────────────────────────────────
  { name: "trending_discovery",              capability: "trending tokens",                 description: "CoinGecko trending tokens",                  category: "discovery" },
  { name: "sentiment_shifts_discovery",      capability: "sentiment shifts",                description: "Tokens with notable sentiment shifts",       category: "discovery" },
  { name: "polymarket_insight",              capability: "Polymarket prediction markets",   description: "Polymarket prediction market insight",       category: "discovery" },
  { name: "alpha_tweet_influencer_analysis", capability: "alpha tweets and KOL analysis",   description: "High signal-to-noise tweets and KOL ranking", category: "discovery" },
  { name: "twitter_user_alpha_metrics",      capability: "KOL alpha track record",          description: "Twitter user alpha metrics and track record", category: "discovery" },

  // ── Finance / equity / macro ──────────────────────────────────────
  // All advertised but redirect to the TrueNorth app. Per the 2026-04-29
  // sync, only crypto tools are public-usable; equity/commodity/macro are
  // marketing surfaces that route users to subscribe at app.true-north.xyz.
  { name: "stock_price_snapshot",  capability: "US stock price snapshot",   description: "Real-time price snapshot for a US stock",      category: "finance" },
  { name: "stock_price_history",   capability: "US stock OHLCV history",    description: "OHLCV price history for a US stock",           category: "finance" },
  { name: "market_index_price",    capability: "market index price",        description: "Latest price for a market index (SP500, VIX)", category: "finance" },
  { name: "commodity_price",       capability: "commodity price history",   description: "OHLCV history for gold, oil, gas, metals",     category: "finance" },
  { name: "analyst_estimates",     capability: "analyst estimates",         description: "EPS, revenue consensus, price targets",        category: "finance" },
  { name: "company_facts",         capability: "company facts",             description: "FMP profile + SEC EDGAR for a US ticker",      category: "finance" },
  { name: "financial_statements",  capability: "financial statements",      description: "Income, balance sheet, cash flow, key stats",  category: "finance" },
  { name: "stock_dividends",       capability: "stock dividend history",    description: "Historical stock dividends",                   category: "finance" },
  { name: "stock_splits",          capability: "stock split history",       description: "Historical stock splits",                      category: "finance" },
];

const APP_ONLY_NAMES = new Set(APP_ONLY_TOOLS.map((t) => t.name));

export function isAppOnly(toolName: string): boolean {
  return APP_ONLY_NAMES.has(toolName);
}

function getAppOnlyTool(toolName: string): AppOnlyTool | undefined {
  return APP_ONLY_TOOLS.find((t) => t.name === toolName);
}

export function appOnlyAsToolInfo(t: AppOnlyTool): ToolInfo {
  return {
    name: t.name,
    description: `${t.description} — available in the TrueNorth app at ${APP_URL}`,
    inputSchema: { type: "object", properties: {} },
    appOnly: true,
    homepage: APP_URL,
  };
}

export function printAppOnlyMessage(toolName: string, jsonMode = false): void {
  const tool = getAppOnlyTool(toolName);
  if (!tool) return; // unreachable: callers gate via isAppOnly()
  const capability = tool.capability;

  if (jsonMode) {
    printJson({
      status: "app_only",
      tool: toolName,
      capability,
      message: "This capability is available in the TrueNorth app.",
      url: APP_URL,
    });
    return;
  }

  console.log();
  console.log(chalk.bold.cyan("  ✨ Available in the TrueNorth app"));
  console.log();
  console.log(`  ${chalk.white(capability)} is part of TrueNorth's full intelligence suite,`);
  console.log(`  including equity, commodity, macro, meme and KOL analytics.`);
  console.log();
  console.log(`  Subscribe and explore: ${chalk.cyan.underline(APP_URL)}`);
  console.log();
}

// ── Stub command registration ────────────────────────────────────────

function addLeaf(parent: Command, name: string, description: string, toolName: string): void {
  const cmd = parent.command(name).description(description);
  addJsonOption(cmd);
  cmd.action((opts: Record<string, unknown>) => {
    printAppOnlyMessage(toolName, isJsonMode(opts));
  });
}

export function registerAppOnlyCommands(program: Command): void {
  // Meme group → `tn meme <subcommand>`
  const meme = program
    .command("meme")
    .description("Meme analytics (in the TrueNorth app)");
  addLeaf(meme, "discovery",  "Trending meme tokens",                 "meme_discovery");
  addLeaf(meme, "pulse",      "Meme market pulse (holders, flow)",    "meme_market_pulse");
  addLeaf(meme, "safeguards", "Meme contract security checks",        "meme_project_safeguards");
  addLeaf(meme, "momentum",   "Meme social momentum and sentiment",   "meme_social_momentum");
  addLeaf(meme, "narrative",  "Meme token narrative and story arc",   "meme_token_narrative");

  // KOL group → `tn kol <subcommand>`
  const kol = program
    .command("kol")
    .description("KOL and alpha tweet analytics (in the TrueNorth app)");
  addLeaf(kol, "alpha",   "Alpha tweets and influencer analysis", "alpha_tweet_influencer_analysis");
  addLeaf(kol, "metrics", "Twitter user alpha track record",      "twitter_user_alpha_metrics");

  // Singles → `tn <command>`
  addLeaf(program, "trending",        "Trending token discovery (in the TrueNorth app)",        "trending_discovery");
  addLeaf(program, "sentiment",       "Sentiment shifts discovery (in the TrueNorth app)",      "sentiment_shifts_discovery");
  addLeaf(program, "polymarket",      "Polymarket prediction market insight (in the TrueNorth app)", "polymarket_insight");
  addLeaf(program, "stock-dividends", "Historical stock dividends (in the TrueNorth app)",      "stock_dividends");
  addLeaf(program, "stock-splits",    "Historical stock splits (in the TrueNorth app)",         "stock_splits");
}
