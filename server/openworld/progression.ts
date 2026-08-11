// Pure StreetForge progression rules: category mastery is explicit, uncapped and never grants XP to unrelated weapons.
import type { WeaponCategory } from "./catalog";

export function totalXpRequiredForLevel(level: number) {
  const safe = Math.max(1, Math.floor(level));
  return 100 + 55 * safe + 18 * safe * safe;
}

export function masteryXpRequiredForLevel(level: number) {
  const safe = Math.max(1, Math.floor(level));
  return 45 + 25 * safe + 9 * safe * safe;
}

export function levelFromTotalXp(totalXp: number, required: (level: number) => number) {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (remaining >= required(level)) {
    remaining -= required(level);
    level += 1;
  }
  return { level, remainingXp: remaining, nextLevelXp: required(level) };
}

export function weaponDamageMultiplierBasisPoints(category: WeaponCategory, masteryLevel: number) {
  const level = Math.max(1, Math.floor(masteryLevel));
  const categoryBias: Record<WeaponCategory, number> = { melee: 85, sidearm: 72, smg: 61, shotgun: 96, rifle: 79, marksman: 83, heavy: 70, thrown: 68 };
  return 10_000 + Math.floor(Math.sqrt(level) * categoryBias[category]);
}

export function resolveAuthoritativeWeaponDamage(input: { category: WeaponCategory; masteryLevel: number; baseDamage: number }) {
  const baseDamage = Math.max(0, Math.floor(input.baseDamage));
  const multiplierBasisPoints = weaponDamageMultiplierBasisPoints(input.category, input.masteryLevel);
  return {
    baseDamage,
    multiplierBasisPoints,
    finalDamage: Math.max(0, Math.floor((baseDamage * multiplierBasisPoints) / 10_000)),
  };
}

export function resolveWeaponUse(input: { equippedCategory: WeaponCategory; actionCategory: WeaponCategory; masteryXp: number; totalMasteryXp: number }) {
  if (input.equippedCategory !== input.actionCategory || input.masteryXp <= 0) {
    return { awardedMasteryXp: 0, totalMasteryXp: input.totalMasteryXp, level: levelFromTotalXp(input.totalMasteryXp, masteryXpRequiredForLevel).level };
  }
  const totalMasteryXp = input.totalMasteryXp + Math.floor(input.masteryXp);
  return { awardedMasteryXp: Math.floor(input.masteryXp), totalMasteryXp, level: levelFromTotalXp(totalMasteryXp, masteryXpRequiredForLevel).level };
}
