<p align="center">
  <h1 align="center">TrueNorth CLI</h1>
  <p align="center">
    Crypto market intelligence in your terminal.
    <br />
    Technical analysis, derivatives, options, DeFi metrics, and more — plus a window into TrueNorth's full equity, commodity, macro, meme, and KOL suite at <a href="https://app.true-north.xyz/">app.true-north.xyz</a>.
  </p>
</p>

<p align="center">
  <a href="https://app.true-north.xyz"><img alt="Website" src="https://img.shields.io/badge/TrueNorth-app.true--north.xyz-8B5CF6"></a>
  <a href="https://www.npmjs.com/package/@truenorth-ai/cli"><img alt="npm" src="https://img.shields.io/npm/v/@truenorth-ai/cli"></a>
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
- **HIP-4 Outcome Markets** — Read-only quotes, books, trades, and candles for Hyperliquid prediction markets
- **NER Detection** — Extract token, chain, and protocol entities from text
- **Options Intelligence** — Max pain, GEX, IV term structure, risk reversal, block trades
- **Agent-Friendly** — Every command supports `--json` for raw JSON output. Self-describing tool schemas via `tn tools --json`

> **Looking for stock / equity / commodity / macro data, Polymarket insights, KOL alpha, trending or sentiment shifts, or meme analytics?** These capabilities live in the [TrueNorth web app](https://app.true-north.xyz/). The CLI advertises them in `tn tools` and prints a redirect when invoked — see [TrueNorth app capabilities](#truenorth-app-capabilities).

## Installation

### npm (recommended)

```bash
npm i -g @truenorth-ai/cli
```

### Agent skills

Install as an AI agent skill ([skills.sh](https://skills.sh/Advent-AI/truenorth-cli/truenorth) | [ClawHub](https://clawhub.ai/LJlkdskdjflsa/truenorth)):

```bash
# skills.sh (Claude Code, Cursor, Windsurf, Copilot, Codex, etc.)
npx skills add Advent-AI/truenorth-cli@truenorth -g -y

# ClawHub (OpenClaw)
clawhub install truenorth
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

### Options Intelligence

| Command | Description |
|---------|-------------|
| `tn options <token>` | Options intelligence (max pain, GEX, IV, walls, blocks) |

```bash
tn options bitcoin                # 10-section options report
tn options ethereum --json        # Raw JSON for agents
```

### Hyperliquid HIP-4 Outcome Markets

Read-only access to [Hyperliquid HIP-4](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-4-outcome-markets) outcome markets — direct from `api.hyperliquid.xyz/info`, no auth required.

| Command | Description |
|---------|-------------|
| `tn hip4 markets` | List active outcome markets |
| `tn hip4 quote <id>` | YES/NO mid prices and spreads |
| `tn hip4 book <id> [--side yes\|no]` | Full L2 orderbook |
| `tn hip4 trades <id> [--side yes\|no] [--limit N]` | Recent trades |
| `tn hip4 candles <id> [--interval 1m] [--lookback 1h]` | OHLC candles |

```bash
tn hip4 markets                            # See what's live
tn hip4 quote 1                            # YES/NO quote for outcome #1
tn hip4 book 1 --side yes                  # Full L2 book
tn hip4 trades 1 --limit 10                # Last 10 fills
tn hip4 candles 1 --interval 5m --lookback 4h
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

## TrueNorth app capabilities

The CLI is **crypto-only**. Stock, equity, commodity, macro, Polymarket, KOL, trending, sentiment, and meme capabilities are gated to the [TrueNorth web app](https://app.true-north.xyz/). They appear in `tn tools` (tagged `app`) and any invocation — through a dedicated stub command or `tn call <tool_name>` — prints a redirect.

**Stock / equity / commodity / macro:**

| Command | Capability |
|---------|------------|
| `tn call stock_price_snapshot` | US stock real-time snapshot |
| `tn call stock_price_history` | US stock OHLCV history |
| `tn call market_index_price` | SP500 / NASDAQ / VIX |
| `tn call commodity_price` | Gold / oil / gas / metals |
| `tn call analyst_estimates` | Analyst EPS, revenue, price targets |
| `tn call company_facts` | FMP profile + SEC EDGAR |
| `tn call financial_statements` | Income, balance sheet, cash flow |
| `tn stock-dividends` | Historical stock dividends |
| `tn stock-splits` | Historical stock splits |

**Polymarket, KOL, trending & sentiment:**

| Command | Capability |
|---------|------------|
| `tn polymarket` | Polymarket prediction insight |
| `tn kol alpha` | Alpha tweet & influencer analysis |
| `tn kol metrics` | Twitter user alpha track record |
| `tn trending` | CoinGecko trending tokens |
| `tn sentiment` | Tokens with sentiment shifts |

**Meme analytics:**

| Command | Capability |
|---------|------------|
| `tn meme discovery` | Trending meme tokens |
| `tn meme pulse` | Meme holder distribution and flow |
| `tn meme safeguards` | Meme contract security checks |
| `tn meme momentum` | Meme social momentum |
| `tn meme narrative` | Meme token narrative |

Subscribe at [app.true-north.xyz](https://app.true-north.xyz/) to unlock these tools.

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

## License

[MIT](LICENSE)
