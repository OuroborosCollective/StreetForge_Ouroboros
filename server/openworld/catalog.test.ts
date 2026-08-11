import { describe, expect, it } from "vitest";
import { masteryTrees, starterWeapons, starterWorld, weaponCategories } from "./catalog";

describe("StreetForge content registry", () => {
  it("exposes deterministic districts with a quest and local contacts", () => {
    expect(starterWorld.districts.length).toBeGreaterThanOrEqual(3);
    expect(starterWorld.quests.length).toBeGreaterThan(0);
    expect(starterWorld.npcs.length).toBeGreaterThan(0);
    expect(new Set(starterWorld.districts.map((district) => district.moduleKey)).size).toBe(starterWorld.districts.length);
  });

  it("keeps weapon definitions and mastery trees aligned", () => {
    expect(starterWeapons.length).toBeGreaterThan(0);
    for (const category of weaponCategories) expect(masteryTrees[category].length).toBeGreaterThan(0);
  });
});
