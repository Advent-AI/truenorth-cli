# CLAUDE.md — TrueNorth CLI

## Overview

Standalone npm CLI for the TrueNorth agent-tools REST API. It exposes only
`tools`, `call`, and `batch`; every tool is discovered and invoked dynamically.

## Tech Stack

- TypeScript (strict, ESM, NodeNext)
- Commander.js
- Chalk, cli-table3, and ora
- Vitest

## Development Commands

```bash
npm install
npm run build
npm test
```

## Architecture

```text
src/
├── index.ts
├── program.ts
├── config.ts
├── types.ts
├── utils.ts
├── api/
│   ├── client.ts
│   └── tools.ts
└── commands/
    ├── tools.ts
    ├── call.ts
    └── batch.ts
```

## API

- Default base URL: `https://tn-api.truenorth.xyz/api/agent-tools`
- `GET /` lists tools and schemas.
- `POST /call` calls one tool with `{toolName, arguments}`.
- `POST /batch` calls several tools with `{calls: [{toolName, arguments}]}`.

Do not add tool-specific commands or local tool registries. New API tools must
become available through `tools`, `call`, and `batch` without a CLI release.

## Conventions

- JSON modes must remain clean for piping.
- Use `wrapAction()` for command error handling.
- Use the shared API client for HTTP requests.
- Keep the API envelopes compatible with the Python CLI.
- Configuration is read from `TN_BASE_URL` or
  `~/.truenorth/config.json`; there is no `config` command.
