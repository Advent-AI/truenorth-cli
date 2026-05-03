# CLAUDE.md — TrueNorth CLI

## Overview

Standalone npm CLI wrapping the Discovery Agents tool REST API. Provides terminal UX with interactive prompts, formatted tables, colored output, spinners, and `--json` raw output mode.

## Tech Stack

- **TypeScript** (strict, ESM, NodeNext)
- **Commander.js** — command routing
- **@inquirer/prompts** — interactive prompts
- **chalk** — colored terminal output
- **cli-table3** — table formatting
- **ora** — spinners
- **Vitest** — testing

## Development Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript → dist/
npm run dev          # Watch mode
npm link             # Link globally as `tn`
npm test             # Run tests
```

## Architecture

```
src/
├── index.ts           # Commander program, registers all commands
├── config.ts          # ~/.truenorth/ config (baseUrl, defaults)
├── types.ts           # API response interfaces (ToolInfo carries appOnly?)
├── utils.ts           # Spinner, formatters, wrapAction, table helpers
├── api/
│   ├── client.ts      # HTTP client (fetch → ApiResponse<T>)
│   └── tools.ts       # getToolList(), executeTool()
└── commands/
    ├── tools.ts       # `tn tools` — merges live API + app-only registry
    ├── call.ts        # `tn call <tool>` — generic caller, intercepts app-only
    ├── technical.ts   # `tn ta` / `tn kline`
    ├── market-info.ts # `tn info`
    ├── derivatives.ts # `tn deriv`
    ├── events.ts      # `tn events`
    ├── perps.ts       # `tn risk` (liquidation risk)
    ├── defi.ts        # `tn defi` (protocols, chains)
    ├── search.ts      # `tn perf`, `tn unlock`, `tn ner`
    ├── options.ts     # `tn options` (max pain / GEX / IV)
    ├── hip4.ts        # `tn hip4 markets|quote|book|trades|candles` —
    │                  #  direct HL Info API client (no auth)
    └── app-only.ts    # APP_ONLY_TOOLS registry + stub commands.
                       # Dedicated cmds: `tn meme/*`, `tn kol/*`, `tn trending`,
                       # `tn sentiment`, `tn polymarket`, `tn stock-dividends`,
                       # `tn stock-splits`. Equity/commodity/macro tools
                       # (stock_price_*, market_index_price, commodity_price,
                       # analyst_estimates, company_facts, financial_statements)
                       # are intercepted only via `tn call <tool>` — no
                       # dedicated cmd. All print a TrueNorth-app CTA.
```

## API

- **Base URL**: `https://api.adventai.io/api/agent-tools`
- `GET /` — list tools (returns `{ data: { tools: [...], totalCount } }`)
- `POST /call` — call tool (body: `{ toolName, arguments }`, returns `{ data: { toolName, result, durationMs, isError } }`)

### Direct external APIs (no Discovery Agents proxy)

Some commands hit external public APIs directly (no auth, no discovery-agents
hop). These wrap responses in the same `{ toolName, result, durationMs, isError }`
envelope so the existing formatters work unchanged.

- **`tn hip4 *`** — `src/api/hyperliquid.ts` posts to
  `https://api.hyperliquid.xyz/info` for HIP-4 outcome markets (read-only).

## Conventions

- Every command supports `--json` for raw JSON output
- Use `wrapAction()` to wrap command handlers with error handling
- Use `startSpinner()` / `spinner.stop()` around API calls
- `formatResult()` auto-formats unknown API results (tables for arrays, key-value for objects)
- Config stored in `~/.truenorth/config.json`

## Adding a New Command

1. Create `src/commands/<name>.ts`
2. Export `registerXxxCommand(program: Command)`
3. Import and call in `src/index.ts`
4. Follow existing pattern: `addJsonOption()`, `wrapAction()`, spinner, `formatResult()`

## App-only capabilities

Tools that are advertised but not callable through the public API live in `src/commands/app-only.ts` (`APP_ONLY_TOOLS`). Adding a new app-only tool:

1. Append an entry to `APP_ONLY_TOOLS` (`name`, `capability`, `description`, `category`).
2. If you want a dedicated CLI command, add an `addLeaf(...)` call in `registerAppOnlyCommands()`.
3. The tool automatically appears in `tn tools` (tagged `app`) and `tn call <name>` automatically prints the CTA. No other wiring needed.

When the user asks for a capability we genuinely don't have yet, prefer adding it as app-only over silently failing — the CTA is the marketing surface mandated in the TN CLI sync (2026-04-29).
