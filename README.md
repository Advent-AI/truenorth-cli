<p align="center">
  <h1 align="center">TrueNorth CLI</h1>
  <p align="center">
    Crypto analysis tools in your terminal — powered by Discovery Agents.
    <br />
    Technical analysis, derivatives, meme coins, KOL tracking, DeFi metrics, and 29 tools at your fingertips.
  </p>
</p>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/node-%3E%3D18-brightgreen">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg">
  <img alt="Tools" src="https://img.shields.io/badge/tools-29-orange">
</p>

---

## Features

- **Technical Analysis** — RSI, MACD, Bollinger Bands, support/resistance, candlestick patterns with configurable timeframes
- **Derivatives & Perps** — Funding rates, open interest, liquidation risk, smart money tracking on Hyperliquid
- **Market Discovery** — Trending tokens, news & events, web search, token unlock schedules, performance scanner
- **Meme Coin Suite** — Discovery, contract safety, market pulse, social momentum, and narrative analysis
- **KOL Tracking** — Leaderboard, individual performance, and RAG-powered insight search
- **DeFi Analytics** — Protocol and chain metrics from DeFiLlama (TVL, fees, revenue, growth)
- **Prediction Markets** — Polymarket probabilities and crowd-sourced forecasts
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
# List all 29 available tools
tn tools

# Technical analysis
tn ta bitcoin
tn ta ethereum --timeframe 1d

# Market discovery
tn trending
tn events solana --time-window 7d

# Comprehensive token scan
tn scan bitcoin

# Meme coin safety check
tn meme safety DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 --network-id solana

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
| `tn tools --filter meme` | Filter by keyword |
| `tn call <tool> [--args]` | Call any tool generically |

```bash
tn tools                                        # Table view of all 29 tools
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
| `tn deriv <token>` | Derivatives (funding rates, OI, liquidations) |
| `tn scan <token>` | Comprehensive combo analysis |
| `tn perf` | Token performance scanner |

```bash
tn ta bitcoin                     # Default 4h timeframe
tn ta ethereum --timeframe 1d     # Daily timeframe
tn kline solana --timeframe 1h    # Hourly candlesticks
tn deriv bitcoin                  # Funding, OI, liquidation heatmap
tn scan bitcoin                   # Full combo scan
tn perf --top 20                  # Top 20 performers by relative strength
```

### Market & Events

| Command | Description |
|---------|-------------|
| `tn trending` | Trending tokens from CoinGecko |
| `tn events <query>` | News & events from 7 sources |
| `tn search <query>` | Web search for crypto topics |
| `tn unlock <token>` | Token unlock schedule |

```bash
tn trending                       # Top trending tokens
tn trending --limit 30            # More results
tn events bitcoin --time-window 7d  # Last 7 days of BTC news
tn search "ETH merge impact"      # Web search
tn unlock arbitrum                # Upcoming ARB unlocks
```

### Meme Tokens

| Command | Description |
|---------|-------------|
| `tn meme discover` | Discover trending meme tokens |
| `tn meme safety <addr>` | Contract security & rug pull check |
| `tn meme pulse <addr>` | Market dynamics & holder distribution |
| `tn meme social <addr>` | Community metrics & social presence |
| `tn meme narrative <addr>` | Content themes & narrative analysis |

```bash
tn meme discover                  # Top meme coins by volume & social buzz
tn meme discover --limit 50       # More results
tn meme safety DezXAZ... --network-id solana   # Contract audit
tn meme pulse DezXAZ...           # Market pulse & holder stats
tn meme social DezXAZ...          # Twitter, Telegram, Discord metrics
tn meme narrative DezXAZ...       # What's the story behind this token?
```

### Perpetuals (Hyperliquid)

| Command | Description |
|---------|-------------|
| `tn perps positions` | View active Hyperliquid positions |
| `tn perps smart-money <token>` | Smart money flow analysis |
| `tn perps risk` | Liquidation risk calculator |
| `tn perps playbook <addr>` | Trading playbook analysis |

```bash
tn perps positions --address 0x...   # Your open positions
tn perps smart-money bitcoin         # What are whales doing?
tn perps risk --token bitcoin --dir long --price 95000 --liq 80000
tn perps playbook 0xabc...           # Analyze a trader's strategy
```

### Prediction Markets

| Command | Description |
|---------|-------------|
| `tn polymarket [query]` | Polymarket prediction market insights |

```bash
tn polymarket                        # Browse markets
tn polymarket --type crypto --token bitcoin  # Filter by crypto
```

### KOL Tracking

| Command | Description |
|---------|-------------|
| `tn kol leaderboard` | Top KOLs ranked by performance |
| `tn kol performance <handle>` | Individual KOL stats |
| `tn kol search <query>` | Search KOL insights (RAG) |

```bash
tn kol leaderboard --limit 20       # Top 20 KOLs
tn kol performance CryptoHayes      # Deep dive on a specific KOL
tn kol search "solana ecosystem"    # What are KOLs saying about Solana?
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
tn trending --json | jq '.result.trending[].name'  # Pipe to jq
tn tools --json | jq '.[].name'                    # List all tool names
tn call events --query bitcoin --json              # Generic call with JSON output
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
