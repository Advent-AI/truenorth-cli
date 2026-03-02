<p align="center">
  <h1 align="center">TrueNorth CLI</h1>
  <p align="center">
    Crypto analysis tools in your terminal — powered by Discovery Agents.
    <br />
    Technical analysis, derivatives, market data, DeFi metrics, and more at your fingertips.
  </p>
</p>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/node-%3E%3D18-brightgreen">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg">
</p>

---

## Features

- **Technical Analysis** — RSI, MACD, Bollinger Bands, support/resistance, candlestick patterns with configurable timeframes
- **Kline Charts** — Candlestick/OHLCV analysis across multiple timeframes
- **Market Data** — ATH, market cap, supply, price, and fundamental metrics
- **Derivatives** — Funding rates, open interest, liquidation heatmaps
- **Liquidation Risk** — Calculate liquidation risk with entry price and direction
- **Events & News** — Crypto news and announcements from 7 sources
- **DeFi Analytics** — Protocol and chain metrics from DeFiLlama (TVL, fees, revenue, growth)
- **Performance Scanner** — Rank tokens by relative strength vs benchmark
- **Token Unlocks** — Upcoming vesting and unlock schedules
- **NER Detection** — Extract token, chain, and protocol entities from text
- **Agent-Friendly** — Every command supports `--json` for raw JSON output. Self-describing tool schemas via `tn tools --json`

## Installation

```bash
git clone https://github.com/Advent-AI/truenorth-cli.git
cd truenorth-cli
npm install
npm run build
npm link
```

**Requires Node.js >= 18**

## Quick Start

```bash
# List all available tools
tn tools

# Technical analysis
tn ta bitcoin
tn ta ethereum --timeframe 1d

# Market fundamentals
tn info bitcoin

# Derivatives
tn deriv ethereum

# News & events
tn events solana --time-window 7d

# Raw JSON for scripting / AI agents
tn ta bitcoin --json
tn tools --json
```

## Commands

### Tool Discovery

| Command | Description |
|---------|-------------|
| `tn tools` | List all available tools |
| `tn tools --verbose` | Show full descriptions + input schemas |
| `tn tools --filter <keyword>` | Filter by keyword |
| `tn call <tool> [--args]` | Call any tool generically |

```bash
tn tools                                        # Table view of all tools
tn tools --verbose --filter derivatives         # Full schema for matching tools
tn call technical_analysis --token-address bitcoin --timeframe 4h
tn call events --query solana --time-window 7d  # Any tool, any args
```

> **Dynamic discovery:** `tn tools --json` returns every tool's name, description, and full input schema. AI agents can use this for runtime tool discovery — no documentation needed.

### Technical Analysis

| Command | Description |
|---------|-------------|
| `tn ta <token>` | Technical indicators (RSI, MACD, support/resistance) |
| `tn kline <token>` | Kline/candlestick chart analysis |

```bash
tn ta bitcoin                     # Default 4h timeframe
tn ta ethereum --timeframe 1d     # Daily timeframe
tn kline solana --timeframe 1h    # Hourly candlesticks
```

### Market Data

| Command | Description |
|---------|-------------|
| `tn info <token>` | Basic market info (ATH, market cap, supply, price) |
| `tn deriv <token>` | Derivatives (funding rates, OI, liquidations) |
| `tn risk` | Liquidation risk calculator |

```bash
tn info bitcoin                   # Market cap, ATH, supply, fundamentals
tn deriv bitcoin                  # Funding, OI, liquidation heatmap
tn risk --token bitcoin --dir long --price 95000 --liq 80000
```

### Events & News

| Command | Description |
|---------|-------------|
| `tn events <query>` | Crypto news & events from 7 sources |

```bash
tn events bitcoin --time-window 7d   # Last 7 days of BTC news
tn events solana --time-window 30d   # Last 30 days
```

### DeFi

| Command | Description |
|---------|-------------|
| `tn defi protocols` | Query DeFi protocols (TVL, fees, revenue) |
| `tn defi chains` | Query blockchain chains (TVL, fees, growth) |

```bash
tn defi protocols --sort tvl_growth  # Fastest growing protocols
tn defi chains --sort fees_growth    # Chains with rising fee revenue
```

### Performance & Unlocks

| Command | Description |
|---------|-------------|
| `tn perf` | Token performance scanner |
| `tn unlock <token>` | Token unlock schedule |

```bash
tn perf --top 20                  # Top 20 performers by relative strength
tn unlock arbitrum                # Upcoming ARB unlocks
```

### Utility

| Command | Description |
|---------|-------------|
| `tn ner <text>` | Named entity recognition for crypto text |
| `tn config` | Configure CLI settings |

```bash
tn ner "Is SOL better than ETH?"     # Extract token/chain/protocol entities
tn config                            # Interactive settings menu
```

## Output Format

By default, all commands display data using formatted tables, colored text, and human-friendly numbers (e.g. `$95,432.00`, `+3.46%`). To get raw JSON output for scripting or piping, add the `--json` flag to any command:

```bash
tn ta bitcoin --json                              # Full technical analysis as JSON
tn info ethereum --json | jq '.result.market_data' # Pipe to jq
tn tools --json | jq '.[].name'                    # List all tool names
```

## Configuration

```bash
tn config    # Interactive settings menu
```

| Setting | Default | Description |
|---------|---------|-------------|
| Base URL | `https://api.adventai.io/api/agent-tools` | API endpoint |
| Default Timeframe | `4h` | Chart timeframe for TA commands |
| Default Limit | `20` | Number of results for list commands |

Settings stored in `~/.truenorth/config.json`.

## Agent Integration

TrueNorth CLI is designed to work as a tool provider for AI agents. Two commands are all an agent needs:

```bash
# 1. Discover available tools and their input schemas
tn tools --json

# 2. Call any tool with dynamic arguments
tn call <tool_name> --arg1 value1 --arg2 value2 --json
```

The `tn tools --json` response includes full JSON Schema for every tool's parameters — types, descriptions, required fields, defaults, and enums. No external documentation needed.

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript → dist/
npm run dev          # Watch mode
npm link             # Link globally as `tn`
npm test             # Run tests (Vitest)
```

## License

[MIT](LICENSE)
