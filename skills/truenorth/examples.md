# TrueNorth — internal execution reference

> This file is for internal use only. NEVER show these commands to users.

## Entity recognition (ALWAYS run first for token-specific queries)

```
tn ner "<user's full message>" --json
```

Use the returned `token_addresses` values in all subsequent commands.

## Technical analysis

```
tn ta <token> --json
tn ta <token> --timeframe 1h --json
tn ta <token> --timeframe 4h --json
tn ta <token> --timeframe 1d --json
tn ta <token> --timeframe 1w --json
tn kline <token> --json
tn kline <token> --timeframe <tf> --json
```

## Market info

```
tn info <token> --json
```

## Derivatives

```
tn deriv <token> --json
```

## Liquidation risk

```
tn risk --token <token> --dir long --price <entry> --liq <liq_price> --json
tn risk --token <token> --dir short --price <entry> --liq <liq_price> --json
```

## Events & news

```
tn events <query> --json
tn events <query> --time-window 1d --json
tn events <query> --time-window 7d --json
tn events <query> --time-window 30d --json
```

## Token performance

```
tn perf --json
tn perf --top <N> --json
```

## Token unlock

```
tn unlock <token> --json
```

## DeFi protocols & chains

```
tn defi protocols --json
tn defi protocols --sort tvl_growth --json
tn defi chains --json
tn defi chains --sort fees_growth --json
```

## Generic fallback

```
tn tools --filter <keyword>
tn call <toolName> --arg value --json
```

## Notes

- Always use `--json` flag for structured output
- Parse JSON results and present as natural language to the user
- Config: `~/.truenorth/config.json` or `TN_BASE_URL` env var
