// Auction rule test guard: basic market constraints are deterministic before currency reaches a transaction.
import { describe, expect, it } from "vitest";
import { minimumBid, resolveAuctionExpiry, validateListingInput } from "./auctionRules";

describe("StreetForge auction rules", () => {
  it("requires a strictly higher bid after the first valid price", () => {
    expect(minimumBid(100, 0)).toBe(100);
    expect(minimumBid(100, 174)).toBe(175);
  });

  it("rejects invalid pricing and calculates a bounded expiry", () => {
    expect(() => validateListingInput({ quantity: 1, startingPrice: 80, buyoutPrice: 20, durationHours: 4 })).toThrow();
    const expires = resolveAuctionExpiry(2, new Date("2026-08-11T20:00:00Z"));
    expect(expires.toISOString()).toBe("2026-08-11T22:00:00.000Z");
  });
});

