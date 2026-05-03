import { describe, it, expect } from "vitest";
import {
  assetName,
  assetId,
  sideIndex,
  parseDescription,
  parseExpiry,
  parseLookback,
  LookbackParseError,
} from "../src/api/hyperliquid.js";

describe("sideIndex", () => {
  it("returns 0 for yes", () => {
    expect(sideIndex("yes")).toBe(0);
  });
  it("returns 1 for no", () => {
    expect(sideIndex("no")).toBe(1);
  });
});

describe("assetName", () => {
  it("encodes outcome 1 yes as #10", () => {
    expect(assetName(1, "yes")).toBe("#10");
  });
  it("encodes outcome 1 no as #11", () => {
    expect(assetName(1, "no")).toBe("#11");
  });
  it("encodes outcome 5 yes as #50", () => {
    expect(assetName(5, "yes")).toBe("#50");
  });
  it("encodes outcome 5 no as #51", () => {
    expect(assetName(5, "no")).toBe("#51");
  });
});

describe("assetId", () => {
  it("encodes outcome 1 yes as 100000010", () => {
    expect(assetId(1, "yes")).toBe(100_000_010);
  });
  it("encodes outcome 1 no as 100000011", () => {
    expect(assetId(1, "no")).toBe(100_000_011);
  });
  it("encodes outcome 12 no as 100000121", () => {
    expect(assetId(12, "no")).toBe(100_000_121);
  });
});

describe("parseDescription", () => {
  it("parses the canonical HIP-4 BTC binary spec", () => {
    const desc =
      "class:priceBinary|underlying:BTC|expiry:20260504-0600|targetPrice:78213|period:1d";
    expect(parseDescription(desc)).toEqual({
      class: "priceBinary",
      underlying: "BTC",
      expiry: "20260504-0600",
      targetPrice: "78213",
      period: "1d",
    });
  });

  it("preserves values containing colons (e.g. URLs)", () => {
    expect(parseDescription("foo:bar|note:see https://example.com/a:b")).toEqual({
      foo: "bar",
      note: "see https://example.com/a:b",
    });
  });

  it("ignores parts without a colon", () => {
    expect(parseDescription("foo:1|garbage|bar:2")).toEqual({ foo: "1", bar: "2" });
  });

  it("returns empty object for empty string", () => {
    expect(parseDescription("")).toEqual({});
  });
});

describe("parseExpiry", () => {
  it("parses 20260504-0600 as Tue 2026-05-04 06:00 UTC", () => {
    expect(parseExpiry("20260504-0600")).toBe(Date.UTC(2026, 4, 4, 6, 0));
  });

  it("returns null for malformed input", () => {
    expect(parseExpiry("not-a-date")).toBeNull();
    expect(parseExpiry("2026-05-04")).toBeNull();
    expect(parseExpiry("20260504")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseExpiry(undefined)).toBeNull();
  });
});

describe("parseLookback", () => {
  it("parses 1m as 60_000ms", () => {
    expect(parseLookback("1m")).toBe(60_000);
  });
  it("parses 4h as 4 * 3_600_000", () => {
    expect(parseLookback("4h")).toBe(4 * 3_600_000);
  });
  it("parses 7d as 7 * 86_400_000", () => {
    expect(parseLookback("7d")).toBe(7 * 86_400_000);
  });
  it("trims whitespace", () => {
    expect(parseLookback("  2h  ")).toBe(2 * 3_600_000);
  });
  it("throws on invalid input", () => {
    expect(() => parseLookback("foo")).toThrow(/Invalid lookback/);
    expect(() => parseLookback("1y")).toThrow(/Invalid lookback/);
    expect(() => parseLookback("h1")).toThrow(/Invalid lookback/);
  });
  it("throws typed LookbackParseError (distinguishable from network errors)", () => {
    expect(() => parseLookback("1y")).toThrow(LookbackParseError);
    expect(() => parseLookback("1y")).toThrow(SyntaxError);
    try {
      parseLookback("foo");
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(LookbackParseError);
      expect((e as LookbackParseError).name).toBe("LookbackParseError");
    }
  });
});
