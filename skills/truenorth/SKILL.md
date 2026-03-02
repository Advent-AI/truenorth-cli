---
name: truenorth
description: "Crypto analysis CLI: technical analysis, kline charts, derivatives, DeFi protocols/chains, token performance, events, liquidation risk, token unlock, NER. Powered by TrueNorth."
homepage: https://www.npmjs.com/package/@truenorth-ai/cli
metadata:
  { "openclaw": { "always": false, "emoji": "📈", "homepage": "https://www.npmjs.com/package/@truenorth-ai/cli", "requires": { "bins": ["tn"] }, "install": [{ "id": "node", "kind": "node", "package": "@truenorth-ai/cli@latest", "global": true, "bins": ["tn"], "label": "Install TrueNorth CLI (npm)" }] } }
---

# TrueNorth — crypto analysis & market intelligence skill

**USE THIS SKILL** when the user's message mentions any of:
- **Crypto analysis actions:** technical analysis, TA, kline, candlestick, chart, derivatives, futures data, open interest, funding rate
- **Market research:** token performance, top gainers, top losers, events, news, token unlock
- **DeFi data:** DeFi protocols, TVL, chain comparison, fees, yield
- **Perpetual/risk analysis:** liquidation risk, liquidation price, leverage risk
- **Entity recognition:** NER, extract token names from text
- **Explicit references:** TrueNorth, truenorth, `tn` CLI

**Routing gate (anti-collision):** apply this skill only when the message includes a **crypto analysis/research action**. If the user wants to **trade, swap, transfer, or manage a wallet** — that is NOT this skill. TrueNorth is read-only market intelligence; it does not execute trades or manage funds.

## Intent routing

Match the user's message to the **first** matching row.

### Technical analysis

Triggers: message mentions technical analysis, TA, indicators, RSI, MACD, moving average, support/resistance, or chart analysis for a token.

| User intent pattern | Action |
|---|---|
| "technical analysis for ETH", "TA on BTC", "RSI and MACD for SOL" | `tn ta <token> --json` |
| "ETH technical analysis on 1h timeframe", "BTC TA daily" | `tn ta <token> --timeframe <tf> --json` |
| "kline analysis for ETH", "candlestick data for BTC" | `tn kline <token> --json` |
| "kline for SOL on 4h" | `tn kline <token> --timeframe <tf> --json` |

Timeframe values: `1h`, `4h`, `1d`, `1w`. Default: `4h`.

### Market info

Triggers: message asks about a token's market cap, ATH, circulating supply, or basic price info.

| User intent pattern | Action |
|---|---|
| "market info for ETH", "BTC market cap", "what's the ATH of SOL" | `tn info <token> --json` |

### Derivatives analysis

Triggers: message mentions derivatives, open interest, funding rate, or futures data for a token.

| User intent pattern | Action |
|---|---|
| "derivatives data for ETH", "BTC open interest", "funding rate for SOL" | `tn deriv <token> --json` |

### Liquidation risk

Triggers: message mentions liquidation risk, liquidation price, or leverage risk assessment.

| User intent pattern | Action |
|---|---|
| "liquidation risk for my BTC long at 95000", "what's my liq risk" | `tn risk --token <token> --dir <long\|short> --price <entry> --liq <liq_price> --json` |

### Events & news

Triggers: message asks about crypto events, news, upcoming catalysts, or recent developments.

| User intent pattern | Action |
|---|---|
| "latest BTC news", "crypto events this week" | `tn events <query> --json` |
| "ETH events in the last 24h" | `tn events <query> --time-window 1d --json` |
| "SOL news past month" | `tn events <query> --time-window 30d --json` |

Time window values: `1d`, `7d`, `30d`. Default: `7d`.

### Token performance

Triggers: message mentions top performers, gainers, losers, or performance ranking.

| User intent pattern | Action |
|---|---|
| "top performing tokens", "best gainers today", "token performance" | `tn perf --json` |
| "top 10 tokens by performance" | `tn perf --top 10 --json` |

### Token unlock

Triggers: message mentions token unlock, vesting schedule, or upcoming unlocks.

| User intent pattern | Action |
|---|---|
| "token unlock schedule for ARB", "when does SOL unlock" | `tn unlock <token> --json` |

### DeFi protocols & chains

Triggers: message mentions DeFi protocols, TVL, chain comparison, fees, or DeFi ecosystem data.

| User intent pattern | Action |
|---|---|
| "top DeFi protocols", "protocols by TVL growth" | `tn defi protocols --json` |
| "DeFi protocols sorted by TVL growth" | `tn defi protocols --sort tvl_growth --json` |
| "compare blockchain chains", "chain fees comparison" | `tn defi chains --json` |
| "chains sorted by fee growth" | `tn defi chains --sort fees_growth --json` |

### Named entity recognition

Triggers: message asks to extract token names or entities from text.

| User intent pattern | Action |
|---|---|
| "extract tokens from this text: ..." | `tn ner "<text>" --json` |

### Generic tool call

For any tool not covered above, use the generic caller:

```bash
tn tools --filter <keyword>     # Find available tools
tn call <toolName> --arg value --json   # Call any tool
```

## Notes

- **All commands support `--json`** for machine-readable output. Always use `--json` when parsing results programmatically.
- **Read-only:** TrueNorth is an analysis platform. It does not execute trades, manage wallets, or move funds.
- **No authentication required** for the public API.
- **Config:** stored at `~/.truenorth/config.json`. Change API base URL via `tn config` or `TN_BASE_URL` env var.

## Examples

Full command examples: `{baseDir}/examples.md`
