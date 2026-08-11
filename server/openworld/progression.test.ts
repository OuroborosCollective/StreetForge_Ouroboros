// Progression test guard: each use must advance only its matching weapon category and mastery has no configured maximum level.
import { describe, expect, it } from "vitest";
import { levelFromTotalXp, masteryXpRequiredForLevel, resolveAuthoritativeWeaponDamage, resolveWeaponUse, weaponDamageMultiplierBasisPoints } from "./progression";

describe("StreetForge weapon mastery", () => {
  it("awards mastery XP only when the equipped and active categories match", () => {
    expect(resolveWeaponUse({ equippedCategory: "rifle", actionCategory: "rifle", masteryXp: 16, totalMasteryXp: 5 })).toMatchObject({ awardedMasteryXp: 16, totalMasteryXp: 21 });
    expect(resolveWeaponUse({ equippedCategory: "rifle", actionCategory: "shotgun", masteryXp: 16, totalMasteryXp: 5 })).toMatchObject({ awardedMasteryXp: 0, totalMasteryXp: 5 });
  });

  it("has increasing, uncapped levels and a positive category-specific damage modifier", () => {
    const highProgress = levelFromTotalXp(5_000_000, masteryXpRequiredForLevel);
    expect(highProgress.level).toBeGreaterThan(100);
    expect(weaponDamageMultiplierBasisPoints("rifle", highProgress.level)).toBeGreaterThan(10_000);
  });

  it("applies that modifier to the authoritative damage result", () => {
    const novice = resolveAuthoritativeWeaponDamage({ category: "melee", masteryLevel: 1, baseDamage: 100 });
    const veteran = resolveAuthoritativeWeaponDamage({ category: "melee", masteryLevel: 25, baseDamage: 100 });
    expect(veteran.finalDamage).toBeGreaterThan(novice.finalDamage);
    expect(veteran.multiplierBasisPoints).toBeGreaterThan(10_000);
  });
});
