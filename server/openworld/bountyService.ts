import { and, eq, gte } from "drizzle-orm";
import { bountyClaims, bountyContributions, bountyMissions, cityDistrictStates, dungeonRuns, groupMembers, playerProfiles } from "../../drizzle/schema";
import { getDb } from "../db";
import { bountyReward, validateBountyContribution } from "./bountyRules";

function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

export async function ensureCityBounties() {
  const db = requireDb(await getDb());
  const districts = await db.select().from(cityDistrictStates);
  for (const district of districts.filter((entry) => entry.pressure >= 3 || entry.control === "raider" || entry.control === "enemy").sort((left, right) => left.districtKey < right.districtKey ? -1 : left.districtKey > right.districtKey ? 1 : 0)) {
    const objectiveKey = `dungeon.bounty.${district.districtKey}`;
    const existing = (await db.select().from(bountyMissions).where(and(eq(bountyMissions.objectiveKey, objectiveKey), eq(bountyMissions.state, "open"))).limit(1))[0];
    if (existing) continue;
    const baseReward = district.pressure * 250 + district.alertLevel * 125;
    await db.insert(bountyMissions).values({ objectiveKey, districtKey: district.districtKey, title: `Stabilize ${district.districtKey.replace("district.", "").replaceAll("-", " ")}`, detail: `Complete the marked district operation while pressure is ${district.pressure} and alert is ${district.alertLevel}.`, baseReward, fundedReward: 0, state: "open" });
  }
}

export async function listBounties(userId?: number) {
  await ensureCityBounties();
  const db = requireDb(await getDb());
  const bounties = await db.select().from(bountyMissions);
  const contributions = userId ? await db.select().from(bountyContributions).where(eq(bountyContributions.userId, userId)) : [];
  return bounties.sort((left, right) => right.id - left.id).map((bounty) => ({ ...bounty, totalReward: bountyReward(bounty.baseReward, bounty.fundedReward), myFunding: contributions.filter((contribution) => contribution.bountyMissionId === bounty.id).reduce((sum, contribution) => sum + contribution.amount, 0) }));
}

export async function fundBounty(userId: number, bountyMissionId: number, amount: number) {
  const db = requireDb(await getDb());
  return db.transaction(async (tx) => {
    const bounty = (await tx.select().from(bountyMissions).where(eq(bountyMissions.id, bountyMissionId)).limit(1))[0];
    if (!bounty || bounty.state !== "open") throw new Error("This bounty is no longer open.");
    const profile = (await tx.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1))[0];
    if (!profile) throw new Error("Street Cred profile is unavailable.");
    const validAmount = validateBountyContribution(amount, profile.streetCred);
    await tx.update(playerProfiles).set({ streetCred: profile.streetCred - validAmount }).where(eq(playerProfiles.id, profile.id));
    await tx.insert(bountyContributions).values({ bountyMissionId, userId, amount: validAmount });
    await tx.update(bountyMissions).set({ fundedReward: bounty.fundedReward + validAmount }).where(eq(bountyMissions.id, bounty.id));
    return { bountyMissionId: bounty.id, contribution: validAmount, totalReward: bountyReward(bounty.baseReward, bounty.fundedReward + validAmount) };
  });
}

export async function claimBounty(userId: number, input: { bountyMissionId: number; dungeonRunId: number }) {
  const db = requireDb(await getDb());
  return db.transaction(async (tx) => {
    const bounty = (await tx.select().from(bountyMissions).where(eq(bountyMissions.id, input.bountyMissionId)).limit(1))[0];
    if (!bounty || bounty.state !== "open") throw new Error("This bounty is no longer open.");
    const run = (await tx.select().from(dungeonRuns).where(eq(dungeonRuns.id, input.dungeonRunId)).limit(1))[0];
    if (!run || run.status !== "completed" || run.dungeonKey !== bounty.objectiveKey) throw new Error("A completed matching district operation is required for this bounty.");
    const membership = (await tx.select().from(groupMembers).where(and(eq(groupMembers.groupId, run.groupId), eq(groupMembers.userId, userId))).limit(1))[0];
    if (!membership) throw new Error("Only a participant of the completed operation can claim this bounty.");
    const existing = (await tx.select().from(bountyClaims).where(eq(bountyClaims.bountyMissionId, bounty.id)).limit(1))[0];
    if (existing) throw new Error("This bounty has already been resolved.");
    const profile = (await tx.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1))[0];
    if (!profile) throw new Error("Street Cred profile is unavailable.");
    const reward = bountyReward(bounty.baseReward, bounty.fundedReward);
    await tx.insert(bountyClaims).values({ bountyMissionId: bounty.id, userId, dungeonRunId: run.id, rewardAwarded: reward });
    await tx.update(playerProfiles).set({ streetCred: profile.streetCred + reward }).where(eq(playerProfiles.id, profile.id));
    await tx.update(bountyMissions).set({ state: "resolved", resolvedAt: new Date() }).where(eq(bountyMissions.id, bounty.id));
    return { bountyMissionId: bounty.id, reward, state: "resolved" as const };
  });
}
