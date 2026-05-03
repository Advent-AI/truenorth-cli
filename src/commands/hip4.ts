import { Command } from "commander";
import chalk from "chalk";
import {
  callHip4,
  assetName,
  parseDescription,
  parseExpiry,
  parseLookback,
  type Side,
  type OutcomeMetaResponse,
  type L2BookResponse,
  type RecentTrade,
  type Candle,
} from "../api/hyperliquid.js";
import {
  startSpinner,
  formatDuration,
  printJson,
  isJsonMode,
  wrapAction,
  addJsonOption,
  makeTable,
} from "../utils.js";

// ── Shared input parsers ─────────────────────────────────────────────

function parseOutcomeId(raw: unknown): number {
  return parsePositiveInt(raw, "outcome-id");
}

function normalizeSide(s: unknown): Side {
  const v = String(s ?? "yes").toLowerCase();
  if (v !== "yes" && v !== "no") {
    throw new Error(`--side must be "yes" or "no" (got "${String(s)}")`);
  }
  return v as Side;
}

function parsePositiveInt(raw: unknown, label: string): number {
  const s = String(raw);
  const n = parseInt(s, 10);
  if (isNaN(n) || n < 1 || String(n) !== s.trim()) {
    throw new Error(`${label} must be a positive integer (got "${s}")`);
  }
  return n;
}

// ── Book summary helper ──────────────────────────────────────────────

interface BookSummary {
  bestBid: number | null;
  bestAsk: number | null;
  midPct: number | null;
  spreadCents: number | null;
  bidCount: number;
  askCount: number;
}

function summarizeBook(book: L2BookResponse | undefined): BookSummary {
  const bids = book?.levels?.[0] ?? [];
  const asks = book?.levels?.[1] ?? [];
  const bestBid = bids[0] ? parseFloat(bids[0].px) : null;
  const bestAsk = asks[0] ? parseFloat(asks[0].px) : null;
  const mid =
    bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null;
  const spread =
    bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null;
  return {
    bestBid,
    bestAsk,
    midPct: mid !== null ? mid * 100 : null,
    spreadCents: spread !== null ? spread * 100 : null,
    bidCount: bids.length,
    askCount: asks.length,
  };
}

// ── Command registration ─────────────────────────────────────────────

export function registerHip4Command(program: Command): void {
  const hip4 = program
    .command("hip4")
    .description(
      "Hyperliquid HIP-4 outcome markets (read-only, direct from HL Info API)",
    );

  // markets ─────────────────────────────────────────────────────────
  const markets = hip4
    .command("markets")
    .description("List active HIP-4 outcome markets");
  addJsonOption(markets);
  markets.action(
    wrapAction(async (_opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const spinner = startSpinner("Fetching outcome markets…");
      const result = await callHip4<OutcomeMetaResponse>("hip4_markets", {
        type: "outcomeMeta",
      });
      spinner.stop();

      if (result.isError) {
        throw new Error((result.result as { error: string }).error);
      }
      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }

      const meta = result.result as OutcomeMetaResponse;
      console.log(
        chalk.bold(`\n  HIP-4 Markets ${formatDuration(result.durationMs)}\n`),
      );
      if (!meta.outcomes?.length) {
        console.log(chalk.dim("  No active markets.\n"));
        return;
      }
      const rows = meta.outcomes.map((o) => {
        const spec = parseDescription(o.description);
        const expiryMs = parseExpiry(spec.expiry);
        const ttl =
          expiryMs !== null
            ? `${((expiryMs - Date.now()) / 3_600_000).toFixed(1)}h`
            : "—";
        return [
          String(o.outcome),
          o.name,
          spec.class ?? "—",
          spec.underlying ?? "—",
          spec.targetPrice ? `$${spec.targetPrice}` : "—",
          spec.period ?? "—",
          ttl,
          assetName(o.outcome, "yes"),
          assetName(o.outcome, "no"),
        ];
      });
      console.log(
        makeTable(
          ["#", "Name", "Class", "Underlying", "Target", "Period", "TTL", "YES", "NO"],
          rows,
        ),
      );
      console.log();
    }),
  );

  // quote ─────────────────────────────────────────────────────────
  const quote = hip4
    .command("quote <outcome-id>")
    .description("YES + NO mid prices and spreads for one outcome market");
  addJsonOption(quote);
  quote.action(
    wrapAction(async (outcomeId: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const id = parseOutcomeId(outcomeId);

      const spinner = startSpinner(`Fetching quote for outcome #${id}…`);
      const [yesRes, noRes] = await Promise.all([
        callHip4<L2BookResponse>("hip4_book_yes", {
          type: "l2Book",
          coin: assetName(id, "yes"),
        }),
        callHip4<L2BookResponse>("hip4_book_no", {
          type: "l2Book",
          coin: assetName(id, "no"),
        }),
      ]);
      spinner.stop();

      if (yesRes.isError || noRes.isError) {
        const e = yesRes.isError ? yesRes.result : noRes.result;
        throw new Error((e as { error: string }).error);
      }

      const yes = summarizeBook(yesRes.result as L2BookResponse);
      const no = summarizeBook(noRes.result as L2BookResponse);
      const totalDuration = Math.max(yesRes.durationMs, noRes.durationMs);
      const envelope = {
        toolName: "hip4_quote",
        result: { outcomeId: id, yes, no },
        durationMs: totalDuration,
        isError: false,
      };

      if (isJsonMode(opts)) {
        printJson(envelope);
        return;
      }

      console.log(
        chalk.bold(
          `\n  HIP-4 Quote · outcome #${id} ${formatDuration(totalDuration)}\n`,
        ),
      );
      const rows: [string, string][] = [
        ["YES bid", yes.bestBid !== null ? `$${yes.bestBid.toFixed(4)}` : "—"],
        ["YES ask", yes.bestAsk !== null ? `$${yes.bestAsk.toFixed(4)}` : "—"],
        ["YES mid", yes.midPct !== null ? `${yes.midPct.toFixed(2)}%` : "—"],
        ["YES spread", yes.spreadCents !== null ? `${yes.spreadCents.toFixed(2)}¢` : "—"],
        ["", ""],
        ["NO bid", no.bestBid !== null ? `$${no.bestBid.toFixed(4)}` : "—"],
        ["NO ask", no.bestAsk !== null ? `$${no.bestAsk.toFixed(4)}` : "—"],
        ["NO mid", no.midPct !== null ? `${no.midPct.toFixed(2)}%` : "—"],
        ["NO spread", no.spreadCents !== null ? `${no.spreadCents.toFixed(2)}¢` : "—"],
      ];
      const maxK = Math.max(...rows.map(([k]) => k.length));
      for (const [k, v] of rows) {
        if (!k && !v) {
          console.log();
          continue;
        }
        console.log(`  ${chalk.cyan(k.padEnd(maxK))}  ${v}`);
      }
      console.log();
    }),
  );

  // book ─────────────────────────────────────────────────────────
  const book = hip4
    .command("book <outcome-id>")
    .description("Full L2 orderbook for one side")
    .option("--side <side>", "yes or no", "yes");
  addJsonOption(book);
  book.action(
    wrapAction(async (outcomeId: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const id = parseOutcomeId(outcomeId);
      const side = normalizeSide(opts.side);

      const spinner = startSpinner(
        `Fetching ${side.toUpperCase()} book for outcome #${id}…`,
      );
      const result = await callHip4<L2BookResponse>("hip4_book", {
        type: "l2Book",
        coin: assetName(id, side),
      });
      spinner.stop();

      if (result.isError) {
        throw new Error((result.result as { error: string }).error);
      }
      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }

      const lvl = result.result as L2BookResponse | null;
      if (!lvl?.levels) {
        throw new Error(
          `No orderbook for outcome #${id} ${side.toUpperCase()} (asset ${assetName(id, side)}). Is the outcome id correct?`,
        );
      }
      const [bids, asks] = lvl.levels;
      console.log(
        chalk.bold(
          `\n  HIP-4 ${side.toUpperCase()} Book · outcome #${id} ${formatDuration(result.durationMs)}\n`,
        ),
      );
      console.log(
        chalk.dim(`  ${bids.length} bid levels · ${asks.length} ask levels`),
      );
      console.log();

      // Show top 10 asks (descending so highest is at top, best ask near middle)
      console.log(chalk.cyan("  Asks (sells):"));
      for (const a of asks.slice(0, 10).reverse()) {
        console.log(
          `    ${chalk.red(`$${a.px}`.padEnd(10))}  ×  ${a.sz.padStart(8)}  (${a.n} order${a.n === 1 ? "" : "s"})`,
        );
      }
      console.log(chalk.dim("    ─── spread ───"));
      console.log(chalk.cyan("  Bids (buys):"));
      for (const b of bids.slice(0, 10)) {
        console.log(
          `    ${chalk.green(`$${b.px}`.padEnd(10))}  ×  ${b.sz.padStart(8)}  (${b.n} order${b.n === 1 ? "" : "s"})`,
        );
      }
      console.log();
    }),
  );

  // trades ─────────────────────────────────────────────────────────
  const trades = hip4
    .command("trades <outcome-id>")
    .description("Recent trades for one side")
    .option("--side <side>", "yes or no", "yes")
    .option("--limit <n>", "Max trades to show (default 25)", "25");
  addJsonOption(trades);
  trades.action(
    wrapAction(async (outcomeId: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const id = parseOutcomeId(outcomeId);
      const side = normalizeSide(opts.side);
      const limit = parsePositiveInt(opts.limit ?? "25", "--limit");

      const spinner = startSpinner(
        `Fetching ${side.toUpperCase()} trades for outcome #${id}…`,
      );
      const result = await callHip4<RecentTrade[]>("hip4_trades", {
        type: "recentTrades",
        coin: assetName(id, side),
      });
      spinner.stop();

      if (result.isError) {
        throw new Error((result.result as { error: string }).error);
      }
      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }

      const raw = result.result as RecentTrade[] | null;
      if (raw === null) {
        throw new Error(
          `No trades for outcome #${id} ${side.toUpperCase()} (asset ${assetName(id, side)}). Is the outcome id correct?`,
        );
      }
      const list = raw ?? [];
      console.log(
        chalk.bold(
          `\n  HIP-4 ${side.toUpperCase()} Trades · outcome #${id} ${formatDuration(result.durationMs)}\n`,
        ),
      );
      if (!list.length) {
        console.log(chalk.dim("  No recent trades.\n"));
        return;
      }
      const rows = list.slice(0, limit).map((t) => {
        const ts = new Date(t.time).toISOString().slice(11, 19) + " UTC";
        const direction =
          t.side === "B" ? chalk.green("BUY ") : chalk.red("SELL");
        return [ts, direction, `$${t.px}`, t.sz];
      });
      console.log(makeTable(["Time", "Side", "Price", "Size"], rows));

      const totalSize = list.reduce((s, t) => s + parseFloat(t.sz), 0);
      const buyVol = list
        .filter((t) => t.side === "B")
        .reduce((s, t) => s + parseFloat(t.sz), 0);
      const buyPct = totalSize > 0 ? (buyVol / totalSize) * 100 : 0;
      console.log(
        chalk.dim(
          `\n  ${list.length} trades · ${totalSize.toFixed(0)} contracts · ${buyPct.toFixed(0)}% buy-side`,
        ),
      );
      console.log();
    }),
  );

  // candles ─────────────────────────────────────────────────────────
  const candles = hip4
    .command("candles <outcome-id>")
    .description("OHLC candles for one side")
    .option("--side <side>", "yes or no", "yes")
    .option("--interval <int>", "Candle interval (1m, 5m, 15m, 1h, 4h, 1d)", "1m")
    .option("--lookback <window>", "Lookback window (e.g. 1h, 4h, 1d)", "1h");
  addJsonOption(candles);
  candles.action(
    wrapAction(async (outcomeId: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const id = parseOutcomeId(outcomeId);
      const side = normalizeSide(opts.side);
      const interval = String(opts.interval ?? "1m");
      const lookbackMs = parseLookback(String(opts.lookback ?? "1h"));

      const endTime = Date.now();
      const startTime = endTime - lookbackMs;

      const spinner = startSpinner(
        `Fetching ${interval} candles (last ${(lookbackMs / 3_600_000).toFixed(1)}h) for outcome #${id} ${side.toUpperCase()}…`,
      );
      const result = await callHip4<Candle[]>("hip4_candles", {
        type: "candleSnapshot",
        req: { coin: assetName(id, side), interval, startTime, endTime },
      });
      spinner.stop();

      if (result.isError) {
        throw new Error((result.result as { error: string }).error);
      }
      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }

      const raw = result.result as Candle[] | null;
      if (raw === null) {
        throw new Error(
          `No candles for outcome #${id} ${side.toUpperCase()} (asset ${assetName(id, side)}). Is the outcome id correct?`,
        );
      }
      const list = raw ?? [];
      console.log(
        chalk.bold(
          `\n  HIP-4 ${side.toUpperCase()} Candles · outcome #${id} · ${interval} ${formatDuration(result.durationMs)}\n`,
        ),
      );
      if (!list.length) {
        console.log(chalk.dim("  No candles in window.\n"));
        return;
      }
      // Show last 15 candles (most recent at bottom)
      const rows = list.slice(-15).map((c) => {
        const ts = new Date(c.t).toISOString().slice(11, 16) + " UTC";
        return [ts, `$${c.o}`, `$${c.h}`, `$${c.l}`, `$${c.c}`, c.v];
      });
      console.log(makeTable(["Time", "Open", "High", "Low", "Close", "Vol"], rows));
      console.log(chalk.dim(`\n  ${list.length} candles total · showing last 15`));
      console.log();
    }),
  );
}
