// StreetForge player service: persistent profile, isolated weapon mastery and upload gates are validated server-side.
import { and, eq } from "drizzle-orm";
import { gangMemberships, gangs, playerProfiles, territories, weaponMasteries } from "../../drizzle/schema";
import { getDb } from "../db";
import { weaponCategories, type WeaponCategory } from "./catalog";
import { levelFromTotalXp, masteryXpRequiredForLevel, resolveWeaponUse, totalXpRequiredForLevel, weaponDamageMultiplierBasisPoints } from "./progression";
import { ensureStarterInventory } from "./contentService";

function database<T>(value: T | null): T {
  if (!value) throw new Error("StreetForge database is unavailable.");
  return value;
}

export async function ensurePlayerProfile(userId: number, displayName?: string | null) {
  const db = database(await getDb());
  const existing = (await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1))[0];
  if (existing) { await ensureStarterInventory(userId); return existing; }
  await db.insert(playerProfiles).values({ userId, callsign: (displayName?.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 48) || `Runner-${userId}`), level: 1, totalXp: 0, streetCred: 500, skillPoints: 0, personalForgeUnlocked: false });
  const created = (await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1))[0];
  if (!created) throw new Error("StreetForge profile could not be created.");
  await ensureStarterInventory(userId);
  return created;
}

export async function playerOverview(userId: number, displayName?: string | null) {
  const db = database(await getDb());
  const profile = await ensurePlayerProfile(userId, displayName);
  const memberships = await db.select().from(gangMemberships).where(eq(gangMemberships.userId, userId));
  const gang = memberships[0] ? (await db.select().from(gangs).where(eq(gangs.id, memberships[0].gangId)).limit(1))[0] : undefined;
  const territory = gang ? (await db.select().from(territories).where(eq(territories.gangId, gang.id)).limit(1))[0] : undefined;
  const masteryRows = await db.select().from(weaponMasteries).where(eq(weaponMasteries.userId, userId));
  const masteries = weaponCategories.map((category) => {
    const found = masteryRows.find((row) => row.weaponCategory === category);
    const totalXp = found?.totalXp ?? 0;
    const computed = levelFromTotalXp(totalXp, masteryXpRequiredForLevel);
    return { category, totalXp, level: found?.level ?? computed.level, skillPoints: found?.skillPoints ?? Math.max(0, computed.level - 1), nextLevelXp: computed.nextLevelXp, damageMultiplierBps: weaponDamageMultiplierBasisPoints(category, found?.level ?? computed.level) };
  });
  const level = levelFromTotalXp(profile.totalXp, totalXpRequiredForLevel);
  return {
    profile: { callsign: profile.callsign, level: profile.level, totalXp: profile.totalXp, streetCred: profile.streetCred, skillPoints: profile.skillPoints, nextLevelXp: level.nextLevelXp },
    gang: gang ? { id: gang.id, name: gang.name, tag: gang.tag, rank: memberships[0].rank } : null,
    territory: territory ? { id: territory.id, displayName: territory.displayName, districtKey: territory.districtKey, state: territory.state } : null,
    assetGates: { characterModel: profile.personalForgeUnlocked, territoryModel: Boolean(territory && ["owner", "officer"].includes(memberships[0]?.rank ?? "")) },
    masteries,
  };
}

export async function recordWeaponUse(userId: number, input: { equippedCategory: WeaponCategory; actionCategory: WeaponCategory; masteryXp: number; playerXp: number }) {
  const db = database(await getDb());
  const profile = await ensurePlayerProfile(userId);
  const currentMastery = (await db.select().from(weaponMasteries).where(and(eq(weaponMasteries.userId, userId), eq(weaponMasteries.weaponCategory, input.actionCategory))).limit(1))[0];
  const masteryResult = resolveWeaponUse({ equippedCategory: input.equippedCategory, actionCategory: input.actionCategory, masteryXp: input.masteryXp, totalMasteryXp: currentMastery?.totalXp ?? 0 });
  const profileXp = Math.max(0, profile.totalXp + Math.floor(input.playerXp));
  const profileLevel = levelFromTotalXp(profileXp, totalXpRequiredForLevel).level;
  await db.transaction(async (tx) => {
    await tx.update(playerProfiles).set({ totalXp: profileXp, level: profileLevel, skillPoints: Math.max(0, profileLevel - 1), personalForgeUnlocked: profileLevel >= 15 }).where(eq(playerProfiles.userId, userId));
    if (masteryResult.awardedMasteryXp > 0) {
      if (currentMastery) await tx.update(weaponMasteries).set({ totalXp: masteryResult.totalMasteryXp, level: masteryResult.level, skillPoints: Math.max(0, masteryResult.level - 1) }).where(eq(weaponMasteries.id, currentMastery.id));
      else await tx.insert(weaponMasteries).values({ userId, weaponCategory: input.actionCategory, totalXp: masteryResult.totalMasteryXp, level: masteryResult.level, skillPoints: Math.max(0, masteryResult.level - 1) });
    }
  });
  return { profileLevel, awardedMasteryXp: masteryResult.awardedMasteryXp, weaponMasteryLevel: masteryResult.level, damageMultiplierBps: weaponDamageMultiplierBasisPoints(input.actionCategory, masteryResult.level) };
}
