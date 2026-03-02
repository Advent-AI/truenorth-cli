# TrueNorth CLI (`tn`)

Terminal interface for TrueNorth's crypto analysis tools. Wraps 29 Discovery Agents tools with beautiful terminal output.

## Install

```bash
cd truenorth-cli
npm install
npm run build
npm link    # makes `tn` available globally
```

## Quick Start

```bash
tn tools                          # List all 29 tools
tn ta bitcoin                     # Technical analysis
tn trending                       # Trending tokens
tn deriv ethereum                 # Derivatives analysis
tn events solana --time-window 7d # News & events
tn scan bitcoin                   # Comprehensive token scan
```

## Commands

### Discovery

| Command | Description |
|---------|-------------|
| `tn tools` | List all available tools |
| `tn tools --verbose` | Show full descriptions + parameters |
| `tn tools --filter meme` | Filter by keyword |
| `tn call <tool> [--args]` | Call any tool generically |

### Analysis

| Command | Description |
|---------|-------------|
| `tn ta <token>` | Technical analysis (RSI, MACD, etc.) |
| `tn kline <token>` | Kline/candlestick analysis |
| `tn deriv <token>` | Derivatives (funding, OI, liquidations) |
| `tn scan <token>` | Comprehensive combo analysis |
| `tn perf` | Performance scanner |

### Market

| Command | Description |
|---------|-------------|
| `tn trending` | Trending tokens |
| `tn events <query>` | News & events |
| `tn search <query>` | Web search |
| `tn unlock <token>` | Token unlock schedule |

### Meme Tokens

| Command | Description |
|---------|-------------|
| `tn meme discover` | Discover trending meme tokens |
| `tn meme safety <addr>` | Contract safety check |
| `tn meme pulse <addr>` | Market pulse |
| `tn meme social <addr>` | Social momentum |
| `tn meme narrative <addr>` | Narrative analysis |

### Perpetuals (Hyperliquid)

| Command | Description |
|---------|-------------|
| `tn perps positions` | View positions |
| `tn perps smart-money <token>` | Smart money analysis |
| `tn perps risk` | Liquidation risk calculator |
| `tn perps playbook <addr>` | Trading playbook |

### Prediction Markets

| Command | Description |
|---------|-------------|
| `tn polymarket [query]` | Polymarket insights |

### KOL Tracking

| Command | Description |
|---------|-------------|
| `tn kol leaderboard` | KOL leaderboard |
| `tn kol performance <handle>` | Individual KOL stats |
| `tn kol search <query>` | Search KOL insights |

### DeFi

| Command | Description |
|---------|-------------|
| `tn defi protocols` | Query DeFi protocols |
| `tn defi chains` | Query blockchain chains |

### Utility

| Command | Description |
|---------|-------------|
| `tn ner <text>` | Named entity recognition |
| `tn config` | Configure settings |

## Options

Every command supports:

- `--json` — Raw JSON output (pipe-friendly)
- `--help` — Command-specific help

## Configuration

```bash
tn config    # Interactive settings menu
```

Settings stored in `~/.truenorth/config.json`:
- `baseUrl` — API endpoint (default: production)
- `defaultTimeframe` — Default chart timeframe (default: 4h)
- `defaultLimit` — Default result limit (default: 20)

## Examples

```bash
# Technical analysis with custom timeframe
tn ta bitcoin --timeframe 1d

# Pipe JSON to jq
tn trending --json | jq '.result.trending[].name'

# Generic tool call with dynamic args
tn call derivatives_analysis --token-address ethereum

# Meme token safety check
tn meme safety DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 --network-id solana
```
