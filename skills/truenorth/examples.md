# TrueNorth CLI Examples

## 1 — Technical analysis

```bash
# Technical analysis with default 4h timeframe
tn ta bitcoin --json
tn ta ethereum --json

# Specify timeframe
tn ta bitcoin --timeframe 1h --json
tn ta solana --timeframe 1d --json

# Kline / candlestick analysis
tn kline bitcoin --json
tn kline ethereum --timeframe 1h --json
```

## 2 — Market info

```bash
# Basic market info (ATH, market cap, supply, price)
tn info bitcoin --json
tn info ethereum --json

# By contract address
tn info --token-address 0x1234... --json
```

## 3 — Derivatives analysis

```bash
# Derivatives data (open interest, funding rate)
tn deriv bitcoin --json
tn deriv ethereum --json
```

## 4 — Liquidation risk

```bash
# Assess liquidation risk for a position
tn risk --token bitcoin --dir long --price 95000 --liq 90000 --json
tn risk --token ethereum --dir short --price 3500 --liq 4000 --json
```

## 5 — Events & news

```bash
# Crypto events (default: last 7 days)
tn events bitcoin --json
tn events "ethereum merge" --json

# Custom time window
tn events solana --time-window 1d --json
tn events "defi hack" --time-window 30d --json
```

## 6 — Token performance

```bash
# Token performance scanner
tn perf --json
tn perf --top 10 --json
```

## 7 — Token unlock

```bash
tn unlock arbitrum --json
tn unlock optimism --json
```

## 8 — DeFi protocols & chains

```bash
# Query DeFi protocols
tn defi protocols --json
tn defi protocols --sort tvl_growth --json

# Query blockchain chains
tn defi chains --json
tn defi chains --sort fees_growth --json
```

## 9 — Named entity recognition

```bash
tn ner "Bitcoin and Ethereum are leading the rally while SOL struggles" --json
```

## 10 — Discover & call any tool

```bash
# List all available tools
tn tools --json

# Filter tools by keyword
tn tools --filter technical

# Verbose mode (shows parameters)
tn tools --verbose

# Generic tool call with arbitrary arguments
tn call technical_analysis --token_address bitcoin --timeframe 1h --json
```

## 11 — Configuration

```bash
# Interactive config
tn config

# Override API base URL via env var
TN_BASE_URL=http://localhost:8000/api/agent-tools tn ta bitcoin --json
```
