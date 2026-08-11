import { describe, expect, it } from "vitest";
import { KAPPA, TICK_DURATION_MS, absKappa, clampKappa, compareStable, hashKappa, nextSeed, quotient, requireKappaInt } from "./kappa";

describe("Kappa deterministic contract", () => {
  it("uses the fixed 1,000,000 scale and a ten-hertz integer tick duration", () => {
    expect(KAPPA).toBe(1_000_000);
    expect(TICK_DURATION_MS).toBe(100);
  });

  it("produces bounded, stable integer-only results", () => {
    expect(clampKappa(-1)).toBe(0);
    expect(clampKappa(KAPPA + 1)).toBe(KAPPA);
    expect(absKappa(-37)).toBe(37);
    expect(quotient(9, 2)).toBe(4);
    expect(compareStable("alpha", "bravo")).toBeLessThan(0);
    expect(nextSeed(7)).toBe(nextSeed(7));
    expect(hashKappa(["npc.iris", "42"])).toBe(hashKappa(["npc.iris", "42"]));
    expect(() => requireKappaInt(0.5)).toThrow("safe integers");
  });
});
