import { describe, expect, it } from "vitest";
import { requireTransferAmount, splitDungeonRewards } from "./socialService";

describe("Dungeon reward sharing", () => {
  it("splits reward pools only across actual member counts", () => {
    expect(splitDungeonRewards(3, 99, 12)).toEqual({ xpEach: 33, lootEach: 4 });
    expect(() => splitDungeonRewards(0, 99, 12)).toThrow(/at least one member/);
  });

  it("accepts only exact positive whole-number transfer amounts", () => {
    expect(requireTransferAmount(25)).toBe(25);
    expect(() => requireTransferAmount(0)).toThrow(/positive whole number/);
    expect(() => requireTransferAmount(1.5)).toThrow(/positive whole number/);
  });
});
