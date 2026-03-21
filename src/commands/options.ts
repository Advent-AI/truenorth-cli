import { Command } from "commander";
import chalk from "chalk";
import { executeTool } from "../api/tools.js";
import {
  startSpinner,
  formatPrice,
  formatPercent,
  formatNumber,
  formatDuration,
  printJson,
  isJsonMode,
  wrapAction,
  addJsonOption,
  makeTable,
} from "../utils.js";

// ── Helpers ───────────────────────────────────────────────────────────

function pct(val: number, spot: number): string {
  const p = ((val / spot) - 1) * 100;
  return formatPercent(p);
}

function bar(iv: number, scale = 5): string {
  return chalk.green("█".repeat(Math.max(1, Math.round(iv / scale))));
}

function section(num: number, title: string): void {
  console.log(chalk.bold.cyan(`\n${num}. ${title} ${"─".repeat(Math.max(1, 50 - title.length))}`));
}

function insight(data: Record<string, unknown>): void {
  if (!data) return;
  const headline = data.headline as string | undefined;
  if (headline) {
    console.log(`   ${chalk.bold.white(headline)}`);
  }
  const scenario = data.current_scenario as string | undefined;
  if (scenario) {
    console.log(chalk.dim(`   ${scenario.slice(0, 200)}${scenario.length > 200 ? "…" : ""}`));
  }
  const implication = data.trading_implication as string | undefined;
  if (implication) {
    console.log(chalk.yellow(`   → ${implication.slice(0, 200)}${implication.length > 200 ? "…" : ""}`));
  }
}

function timeliness(data: Record<string, unknown>): void {
  if (!data) return;
  const freshness = data.freshness as string | undefined;
  if (freshness) {
    console.log(chalk.dim(`   ⏱ ${freshness.slice(0, 120)}`));
  }
}

// ── Custom Renderer ──────────────────────────────────────────────────

function renderOptionsReport(result: Record<string, unknown>): void {
  const spot = result.spot as number;
  const currency = result.currency as string;
  const market = result.market as string;
  const atmIv = result.atm_iv as number;
  const topExpiry = result.top_expiry as string;
  const dte = result.days_to_expiry as number | null;
  const hoursToExpiry = result.hours_to_expiry as number | null;
  const contracts = result.total_contracts as number;
  const summary = result.summary as Record<string, unknown>;
  const sections = result.sections as Record<string, Record<string, unknown>>;
  const freshness = result.data_freshness as Record<string, unknown>;

  // ── Header ──────────────────────────────────────────────────────
  const isUsdc = market !== currency;
  const label = isUsdc ? `${currency} (USDC-settled)` : currency;

  console.log();
  console.log(chalk.bold("══════════════════════════════════════════════════════"));
  console.log(chalk.bold(`  ${label} OPTIONS INTELLIGENCE`));
  console.log(`  Spot: ${formatPrice(spot)} │ ATM IV: ${chalk.white(atmIv + "%")} │ Expiry: ${chalk.white(topExpiry)}${dte !== null ? chalk.dim(` (${dte}d / ${hoursToExpiry}h)`) : ""}`);
  console.log(`  Contracts: ${chalk.white(String(contracts))} │ Sentiment: ${sentimentBadge(summary.sentiment as string)} │ Regime: ${regimeBadge(summary.regime as string)}`);
  console.log(chalk.bold("══════════════════════════════════════════════════════"));

  // ── Summary ─────────────────────────────────────────────────────
  if (summary) {
    console.log();
    console.log(chalk.dim(`  ${summary.headline as string}`));
    const levels = summary.key_levels as Record<string, number | null>;
    if (levels) {
      const parts = [];
      if (levels.max_pain) parts.push(`MaxPain ${formatPrice(levels.max_pain)}`);
      if (levels.gex_flip) parts.push(`GEX Flip ${formatPrice(levels.gex_flip)}`);
      if (levels.nearest_call_wall) parts.push(`Resistance ${formatPrice(levels.nearest_call_wall)}`);
      if (levels.nearest_put_wall) parts.push(`Support ${formatPrice(levels.nearest_put_wall)}`);
      console.log(`  ${chalk.dim("Key:")} ${parts.join(chalk.dim(" │ "))}`);
    }
  }

  // ── 1. Max Pain ─────────────────────────────────────────────────
  const mp = sections.max_pain;
  const mpData = mp.data as Record<string, unknown>;
  section(1, "MAX PAIN");
  console.log(`   ${formatPrice(mpData.strike as number)} (${pct(mpData.strike as number, spot)} from spot)`);
  insight(mp.insight as Record<string, unknown>);

  // ── 2. GEX ──────────────────────────────────────────────────────
  const gex = sections.gex;
  const gexData = gex.data as Record<string, unknown>;
  section(2, "GAMMA EXPOSURE (GEX)");
  console.log(`   Gamma Flip: ${formatPrice(gexData.gamma_flip as number)} (${pct(gexData.gamma_flip as number, spot)})`);
  console.log(`   Call Gamma Wall: ${formatPrice(gexData.call_gamma_wall as number)}  │  Put Gamma Wall: ${formatPrice(gexData.put_gamma_wall as number)}`);
  console.log(`   Regime: ${regimeBadge(gexData.regime as string)}`);
  insight(gex.insight as Record<string, unknown>);

  // ── 3. IV Term Structure ────────────────────────────────────────
  const ivt = sections.iv_term;
  const ivtData = ivt.data as Record<string, unknown>;
  const ts = ivtData.term_structure as Array<Record<string, unknown>>;
  section(3, "IV TERM STRUCTURE");
  console.log(`   Shape: ${chalk.white(String(ivtData.shape).toUpperCase())}`);
  if (ts && ts.length > 0) {
    for (const t of ts.slice(0, 8)) {
      const expiry = String(t.expiry).padStart(9);
      const dte = String(t.dte).padStart(3);
      const iv = (t.atm_iv as number).toFixed(1).padStart(5);
      console.log(`   ${chalk.dim(expiry)} (${dte}d)  ${chalk.white(iv + "%")}  ${bar(t.atm_iv as number)}`);
    }
  }
  insight(ivt.insight as Record<string, unknown>);

  // ── 4. Risk Reversal ────────────────────────────────────────────
  const rr = sections.risk_reversal;
  const rrData = rr.data as Record<string, unknown>;
  section(4, "RISK REVERSAL (25-delta)");
  console.log(`   25d RR: ${formatPercent(rrData.rr_25d as number)} — ${biasBadge(rrData.bias as string)}`);
  const c25 = rrData.call_25d as Record<string, unknown> | undefined;
  const p25 = rrData.put_25d as Record<string, unknown> | undefined;
  if (c25 && p25) {
    console.log(`   25d Call: ${formatPrice(c25.strike as number)} IV=${chalk.white((c25.iv as number).toFixed(1) + "%")}  │  25d Put: ${formatPrice(p25.strike as number)} IV=${chalk.white((p25.iv as number).toFixed(1) + "%")}`);
  }
  insight(rr.insight as Record<string, unknown>);

  // ── 5. Put/Call Ratio ───────────────────────────────────────────
  const pc = sections.pc_ratio;
  const pcData = pc.data as Record<string, unknown>;
  section(5, "PUT/CALL RATIO");
  console.log(`   By OI:     ${chalk.bold.white(String(pcData.by_oi))}  (${formatNumber(pcData.put_oi as number)}P / ${formatNumber(pcData.call_oi as number)}C)`);
  console.log(`   By Volume: ${chalk.bold.white(String(pcData.by_volume))}  (${formatNumber(pcData.put_volume as number)}P / ${formatNumber(pcData.call_volume as number)}C)`);
  insight(pc.insight as Record<string, unknown>);

  // ── 6. IV Skew ──────────────────────────────────────────────────
  const skew = sections.iv_skew;
  const skewData = skew.data as Record<string, unknown>;
  section(6, "IV SKEW");
  console.log(`   Slope: ${formatPercent(skewData.slope as number)}`);
  const otmPuts = skewData.otm_puts as Array<Record<string, unknown>>;
  const otmCalls = skewData.otm_calls as Array<Record<string, unknown>>;
  if (otmPuts && otmPuts.length > 0) {
    console.log(chalk.dim("   OTM Puts (below spot):"));
    for (const p of otmPuts.slice(-3)) {
      console.log(`     ${formatPrice(p.strike as number).padStart(10)}  (${formatPercent(p.moneyness_pct as number)})  IV=${chalk.white((p.iv as number).toFixed(1) + "%")}`);
    }
  }
  if (otmCalls && otmCalls.length > 0) {
    console.log(chalk.dim("   OTM Calls (above spot):"));
    for (const c of otmCalls.slice(0, 3)) {
      console.log(`     ${formatPrice(c.strike as number).padStart(10)}  (${formatPercent(c.moneyness_pct as number)})  IV=${chalk.white((c.iv as number).toFixed(1) + "%")}`);
    }
  }
  insight(skew.insight as Record<string, unknown>);

  // ── 7. Delta Exposure ───────────────────────────────────────────
  const delta = sections.delta_exposure;
  const deltaData = delta.data as Record<string, unknown>;
  section(7, "DELTA EXPOSURE");
  console.log(`   Net:  ${formatNumber(deltaData.net_delta_usd as number)} ${biasBadge(deltaData.bias as string)}`);
  console.log(`   Call: ${formatNumber(deltaData.call_delta_usd as number)}  │  Put: ${formatNumber(deltaData.put_delta_usd as number)}`);
  insight(delta.insight as Record<string, unknown>);

  // ── 8. Call/Put Walls ───────────────────────────────────────────
  const walls = sections.call_put_walls;
  const wallsData = walls.data as Record<string, unknown>;
  section(8, "CALL/PUT WALLS");
  const cw = wallsData.call_walls as Array<Record<string, unknown>>;
  const pw = wallsData.put_walls as Array<Record<string, unknown>>;
  if (cw && cw.length > 0) {
    console.log(chalk.dim("   Resistance (call walls):"));
    const cwRows = cw.map((w) => [
      formatPrice(w.strike as number),
      formatPercent(w.pct_from_spot as number),
      formatNumber(w.oi as number),
    ]);
    console.log(makeTable(["Strike", "From Spot", "OI"], cwRows));
  }
  if (pw && pw.length > 0) {
    console.log(chalk.dim("   Support (put walls):"));
    const pwRows = pw.map((w) => [
      formatPrice(w.strike as number),
      formatPercent(w.pct_from_spot as number),
      formatNumber(w.oi as number),
    ]);
    console.log(makeTable(["Strike", "From Spot", "OI"], pwRows));
  }
  insight(walls.insight as Record<string, unknown>);

  // ── 9. Block Trades ─────────────────────────────────────────────
  const blocks = sections.block_trades;
  const blocksData = blocks.data as Record<string, unknown>;
  section(9, "BLOCK TRADES (>$1M premium)");
  const blockCount = blocksData.count as number;
  const blockBias = blocksData.bias as string;
  console.log(`   Blocks: ${chalk.white(String(blockCount))} │ Bias: ${biasBadge(blockBias)}`);
  const blockTrades = blocksData.trades as Array<Record<string, unknown>>;
  if (blockTrades && blockTrades.length > 0) {
    const rows = blockTrades.slice(0, 5).map((b) => [
      chalk.dim(String(b.time || "").slice(11, 19)),
      (b.direction as string).toUpperCase() === "BUY" ? chalk.green("BUY") : chalk.red("SELL"),
      String(b.instrument),
      formatNumber(b.premium_usd as number),
      formatNumber(b.underlying_notional_usd as number),
      chalk.white((b.iv as number).toFixed(1) + "%"),
    ]);
    console.log(makeTable(["Time", "Side", "Instrument", "Premium", "Notional", "IV"], rows));
  }
  insight(blocks.insight as Record<string, unknown>);

  // ── 10. FOMC Event Study ────────────────────────────────────────
  const event = sections.event_study;
  const eventData = event.data as Record<string, unknown>;
  section(10, "FOMC EVENT STUDY");
  const sampleSize = eventData.sample_size as number;
  if (sampleSize > 0) {
    console.log(`   Sample: ${chalk.white(String(sampleSize))} FOMC meetings`);
    console.log(`   Avg return: ${formatPercent(eventData.avg_total_pct as number)} (pre: ${formatPercent(eventData.avg_pre_pct as number)}, post: ${formatPercent(eventData.avg_post_pct as number)})`);
    const events = eventData.events as Array<Record<string, unknown>>;
    if (events && events.length > 0) {
      const rows = events.map((e) => [
        chalk.dim(String(e.date)),
        formatPercent(e.return_pre_pct as number),
        formatPercent(e.return_post_pct as number),
        formatPercent(e.return_total_pct as number),
        formatPrice(e.price_t0 as number),
      ]);
      console.log(makeTable(["Date", "Pre%", "Post%", "Total%", "Price@T"], rows));
    }
  } else {
    console.log(chalk.dim("   No event study data available"));
  }
  insight(event.insight as Record<string, unknown>);

  // ── Freshness Footer ────────────────────────────────────────────
  if (freshness) {
    console.log(chalk.bold("\n══════════════════════════════════════════════════════"));
    const cached = freshness.is_cached as boolean;
    const ttl = freshness.cache_ttl_seconds as number;
    const nextFomc = freshness.next_fomc as string | null;
    const daysToFomc = freshness.days_to_next_fomc as number | null;

    const parts = [];
    if (cached) {
      parts.push(chalk.yellow(`cached (${freshness.cache_age_seconds}s old, ${freshness.cache_remaining_seconds}s remaining)`));
    } else {
      parts.push(chalk.green(`fresh (TTL ${ttl}s)`));
    }
    if (nextFomc) {
      parts.push(`Next FOMC: ${chalk.white(nextFomc)} (${daysToFomc}d)`);
    }
    console.log(`  ${chalk.dim("Data:")} ${parts.join(chalk.dim(" │ "))}`);

    const guide = freshness.staleness_guide as Record<string, unknown> | undefined;
    if (guide) {
      const rt = (guide.real_time_sensitive as string[]) || [];
      const hr = (guide.hourly_stable as string[]) || [];
      const dy = (guide.daily_stable as string[]) || [];
      console.log(`  ${chalk.dim("Staleness:")} ${chalk.red("●")} ${rt.join(", ")}  ${chalk.yellow("●")} ${hr.join(", ")}  ${chalk.green("●")} ${dy.join(", ")}`);
    }
  }

  console.log();
}

// ── Badge helpers ─────────────────────────────────────────────────

function sentimentBadge(s: string): string {
  if (s === "bearish") return chalk.bgRed.white(" BEARISH ");
  if (s === "bullish") return chalk.bgGreen.black(" BULLISH ");
  return chalk.bgYellow.black(" NEUTRAL ");
}

function regimeBadge(r: string): string {
  if (r === "positive_gamma") return chalk.bgBlue.white(" +γ RANGE-BOUND ");
  if (r === "negative_gamma") return chalk.bgRed.white(" -γ TRENDING ");
  return chalk.dim(r);
}

function biasBadge(b: string): string {
  if (b === "bearish" || b === "short") return chalk.red(b.toUpperCase());
  if (b === "bullish" || b === "long") return chalk.green(b.toUpperCase());
  return chalk.yellow(b.toUpperCase());
}

// ── Command Registration ─────────────────────────────────────────

export function registerOptionsCommand(program: Command): void {
  const cmd = program
    .command("options <token>")
    .description("Options intelligence report for a token")
    .option("--token-address <addr>", "Token address (overrides positional)");

  addJsonOption(cmd);

  cmd.action(
    wrapAction(async (token: unknown, _opts: unknown) => {
      const opts = _opts as Record<string, unknown>;
      const args: Record<string, unknown> = {
        token_address: (opts.tokenAddress as string) ?? (token as string),
      };

      const spinner = startSpinner(`Fetching options data for ${chalk.cyan(args.token_address as string)}…`);
      const result = await executeTool("options_report", args);
      spinner.stop();

      if (isJsonMode(opts)) {
        printJson(result);
        return;
      }

      // Check for tool-level error
      const data = result.result as Record<string, unknown>;
      if (data.status === "error") {
        console.error(chalk.red(`\nError: ${data.error || data.message || "Unknown error"}`));
        if (data.hint) console.error(chalk.dim(`Hint: ${data.hint}`));
        process.exit(1);
      }

      console.log(chalk.bold(`\n  Options Intelligence ${formatDuration(result.durationMs)}\n`));
      renderOptionsReport(data);
    }),
  );
}
