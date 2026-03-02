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
├── types.ts           # API response interfaces
├── utils.ts           # Spinner, formatters, wrapAction, table helpers
├── api/
│   ├── client.ts      # HTTP client (fetch → ApiResponse<T>)
│   └── tools.ts       # getToolList(), executeTool()
└── commands/
    ├── tools.ts       # `tn tools` — list all
    ├── call.ts        # `tn call <tool>` — generic caller
    ├── technical.ts   # `tn ta` / `tn kline`
    ├── derivatives.ts # `tn deriv`
    ├── events.ts      # `tn events`
    ├── trending.ts    # `tn trending`
    ├── meme.ts        # `tn meme` (5 subcommands)
    ├── perps.ts       # `tn perps` (4 subcommands)
    ├── polymarket.ts  # `tn polymarket`
    ├── kol.ts         # `tn kol` (3 subcommands)
    ├── defi.ts        # `tn defi` (2 subcommands)
    ├── scan.ts        # `tn scan`
    └── search.ts      # `tn search`, `tn perf`, `tn unlock`, `tn ner`
```

## API

- **Base URL**: `https://api.adventai.io/api/agent-tools`
- `GET /` — list tools (returns `{ data: { tools: [...], totalCount } }`)
- `POST /call` — call tool (body: `{ toolName, arguments }`, returns `{ data: { toolName, result, durationMs, isError } }`)

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
