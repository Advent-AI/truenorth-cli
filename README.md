# TrueNorth CLI

A small CLI for discovering and calling TrueNorth agent tools. Tool names and
schemas are loaded from the API at runtime; the CLI does not maintain
tool-specific commands.

## Installation

```bash
npm i -g @truenorth-ai/cli
```

Requires Node.js 18 or newer.

## Commands

The CLI exposes exactly three commands:

```bash
# Discover tool names and descriptions
tn tools

# Include runtime input/output schemas
tn tools --schema
tn tools --json --schema

# Filter or select tools
tn tools --filter market
tn tools --names basic_market_info,technical_analysis --json --schema

# Call any discovered tool with dynamic arguments
tn call basic_market_info --token-address bitcoin
tn call technical_analysis --token-address bitcoin --timeframe 1h --json
tn call resolve_asset --query BTC --result

# Structured arguments can be supplied in a JSON file
tn call financial_company_facts -f arguments.json --json

# Execute multiple independent calls in one HTTP request
tn batch '[{"tool":"basic_market_info","args":{"token_address":"bitcoin"}},{"tool":"financial_company_facts","args":{"ticker":"AAPL"}}]' --json
tn batch -f calls.json --json
```

The `arguments.json` file in the example above contains one tool argument
object:

```json
{
  "ticker": "AAPL"
}
```

Dynamic arguments support `--key value`, `--key=value`, and `key=value`.
Kebab-case keys are converted to snake_case, and JSON values are decoded:

```bash
# Number arguments
tn call performance_scanner \
  --universe-size 5 \
  --top-n 3 \
  --lookback-days 7 \
  --json

# Array arguments
tn call market_ticker24h \
  --instruments '["bitcoin","ethereum"]' \
  --json

# Strings and arrays together
tn call time_context \
  --timezone Asia/Shanghai \
  --compare-timezones '["UTC","America/New_York"]' \
  --json
```

`tn call --json` emits the full `{toolName, result, durationMs, isError}`
envelope. `tn call --result` emits only the tool's `result` value.

The `batch` input is a JSON array of `{tool, args}` objects. The CLI translates
these to the API wire format and posts them to `/batch` in one request.

For example, `calls.json` can contain:

```json
[
  {
    "tool": "basic_market_info",
    "args": {
      "token_address": "bitcoin"
    }
  },
  {
    "tool": "technical_analysis",
    "args": {
      "token_address": "ethereum",
      "timeframe": "4h"
    }
  }
]
```

These examples use tools verified against the live API. The current
`tn tools --json --schema` response remains the source of truth because tools
and schemas are discovered dynamically.

## Configuration

The default API base URL is:

```text
https://tn-api.truenorth.xyz/api/agent-tools
```

Override it with `TN_BASE_URL` or place a `baseUrl` value in
`~/.truenorth/config.json`.

When upgrading from a pre-1.0 release, a persisted value matching the previous
default (`https://api.adventai.io/api/agent-tools`) automatically resolves to
the new default. Custom local or staging URLs are preserved.

An authentication token can be stored in `~/.truenorth/auth_token`.

## Development

```bash
npm install
npm run build
npm test
```

## License

[MIT](LICENSE)
