import { and, eq, gt } from "drizzle-orm";
import { chatMessages, cityPresence, dungeonRewards, dungeonRuns, gangMemberships, groupMembers, groupMoneyTransfers, playerGroups, playerProfiles, teamfinderListings } from "../../drizzle/schema";
import { getDb } from "../db";
import { recordStatistic } from "./achievementPremiumService";

type ChatScope = "district" | "gang" | "group";
function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

export function requireTransferAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Transfer amount must be a positive whole number.");
  return amount;
}

export function splitDungeonRewards(memberCount: number, totalXp: number, totalLoot: number) {
  if (!Number.isInteger(memberCount) || memberCount < 1) throw new Error("A dungeon group needs at least one member.");
  return { xpEach: Math.floor(totalXp / memberCount), lootEach: Math.floor(totalLoot / memberCount) };
}

async function memberGroup(userId: number) {
  const db = requireDb(await getDb());
  const membership = (await db.select().from(groupMembers).where(eq(groupMembers.userId, userId)).limit(1))[0];
  if (!membership) throw new Error("Join or create a group before using this channel.");
  const group = (await db.select().from(playerGroups).where(eq(playerGroups.id, membership.groupId)).limit(1))[0];
  if (!group || group.status === "closed") throw new Error("This group is no longer active.");
  return { db, membership, group };
}

export async function createGroup(userId: number) {
  try { await memberGroup(userId); throw new Error("Leave the current group before creating another one."); } catch (error) { if ((error as Error).message !== "Join or create a group before using this channel.") throw error; }
  const db = requireDb(await getDb());
  const result = await db.insert(playerGroups).values({ leaderUserId: userId, status: "open" });
  const groupId = Number(result[0].insertId);
  await db.insert(groupMembers).values({ groupId, userId, role: "leader" });
  return getMyGroup(userId);
}

export async function getMyGroup(userId: number) {
  const { db, membership, group } = await memberGroup(userId);
  const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id));
  return { group, membership, members };
}

export async function transferGroupMoney(senderUserId: number, recipientUserId: number, amount: number) {
  requireTransferAmount(amount);
  if (senderUserId === recipientUserId) throw new Error("A group transfer needs another recipient.");
  const { db, group } = await memberGroup(senderUserId);
  const recipientMembership = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, recipientUserId))).limit(1))[0];
  if (!recipientMembership) throw new Error("The recipient is not a current member of this group.");
  const sender = (await db.select().from(playerProfiles).where(eq(playerProfiles.userId, senderUserId)).limit(1))[0];
  const recipient = (await db.select().from(playerProfiles).where(eq(playerProfiles.userId, recipientUserId)).limit(1))[0];
  if (!sender || !recipient || sender.streetCred < amount) throw new Error("Insufficient Street Cred for this group transfer.");
  await db.transaction(async (tx) => {
    await tx.update(playerProfiles).set({ streetCred: sender.streetCred - amount }).where(eq(playerProfiles.id, sender.id));
    await tx.update(playerProfiles).set({ streetCred: recipient.streetCred + amount }).where(eq(playerProfiles.id, recipient.id));
    await tx.insert(groupMoneyTransfers).values({ groupId: group.id, senderUserId, recipientUserId, amount });
  });
  return { groupId: group.id, recipientUserId, amount };
}

export async function createTeamfinderListing(userId: number, dungeonKey: string, desiredRole: string) {
  let group;
  try { group = (await getMyGroup(userId)).group; } catch { group = (await createGroup(userId)).group; }
  const db = requireDb(await getDb());
  const expiresAt = new Date(Date.now() + 45 * 60 * 1000);
  const result = await db.insert(teamfinderListings).values({ ownerUserId: userId, groupId: group.id, dungeonKey, desiredRole, expiresAt });
  return { listingId: Number(result[0].insertId), groupId: group.id, expiresAt };
}

export async function listTeamfinder() {
  const db = requireDb(await getDb());
  return db.select().from(teamfinderListings).where(and(eq(teamfinderListings.status, "open"), gt(teamfinderListings.expiresAt, new Date())));
}

export async function joinTeamfinderListing(userId: number, listingId: number) {
  const db = requireDb(await getDb());
  const listing = (await db.select().from(teamfinderListings).where(eq(teamfinderListings.id, listingId)).limit(1))[0];
  if (!listing || listing.status !== "open" || listing.expiresAt <= new Date() || !listing.groupId) throw new Error("This teamfinder listing is no longer available.");
  try { await memberGroup(userId); throw new Error("Leave the current group before joining a teamfinder listing."); } catch (error) { if ((error as Error).message !== "Join or create a group before using this channel.") throw error; }
  const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, listing.groupId));
  if (members.length >= 4) throw new Error("This group is already full.");
  await db.insert(groupMembers).values({ groupId: listing.groupId, userId, role: "member" });
  if (members.length + 1 >= 4) await db.update(teamfinderListings).set({ status: "filled" }).where(eq(teamfinderListings.id, listing.id));
  return getMyGroup(userId);
}

async function authorizeChat(userId: number, scope: ChatScope, contextKey: string) {
  const db = requireDb(await getDb());
  if (scope === "district") {
    const presence = (await db.select().from(cityPresence).where(eq(cityPresence.userId, userId)).limit(1))[0];
    if (!presence || presence.districtKey !== contextKey) throw new Error("Enter this district before using its local channel.");
    return { db, districtKey: contextKey, gangId: null, groupId: null };
  }
  if (scope === "gang") {
    const gangId = Number(contextKey);
    const membership = (await db.select().from(gangMemberships).where(and(eq(gangMemberships.userId, userId), eq(gangMemberships.gangId, gangId))).limit(1))[0];
    if (!membership) throw new Error("Only gang members can use this channel.");
    return { db, districtKey: null, gangId, groupId: null };
  }
  const group = await memberGroup(userId);
  if (group.group.id !== Number(contextKey)) throw new Error("Only group members can use this channel.");
  return { db, districtKey: null, gangId: null, groupId: group.group.id };
}

export async function sendChatMessage(userId: number, scope: ChatScope, contextKey: string, body: string) {
  const text = body.trim();
  if (!text || text.length > 480) throw new Error("Chat messages must contain between 1 and 480 characters.");
  const context = await authorizeChat(userId, scope, contextKey);
  const result = await context.db.insert(chatMessages).values({ scope, districtKey: context.districtKey, gangId: context.gangId, groupId: context.groupId, senderUserId: userId, body: text });
  await recordStatistic(userId, "messages_sent");
  return { id: Number(result[0].insertId), body: text, sentAt: new Date() };
}

export async function listChatMessages(userId: number, scope: ChatScope, contextKey: string) {
  const context = await authorizeChat(userId, scope, contextKey);
  const clause = scope === "district" ? eq(chatMessages.districtKey, context.districtKey!) : scope === "gang" ? eq(chatMessages.gangId, context.gangId!) : eq(chatMessages.groupId, context.groupId!);
  return context.db.select().from(chatMessages).where(and(eq(chatMessages.scope, scope), clause)).limit(50);
}

export async function startDungeonRun(userId: number, dungeonKey: string) {
  const { db, group } = await memberGroup(userId);
  if (group.leaderUserId !== userId) throw new Error("Only the group leader can start a dungeon run.");
  const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id));
  if (members.length < 2) throw new Error("A dungeon run requires at least two real group members.");
  await db.update(playerGroups).set({ status: "in_dungeon" }).where(eq(playerGroups.id, group.id));
  const result = await db.insert(dungeonRuns).values({ groupId: group.id, dungeonKey, status: "active" });
  return { runId: Number(result[0].insertId), memberCount: members.length };
}

export async function completeDungeonRun(userId: number, runId: number, totalXp: number, totalLoot: number) {
  const { db, group } = await memberGroup(userId);
  const run = (await db.select().from(dungeonRuns).where(eq(dungeonRuns.id, runId)).limit(1))[0];
  if (!run || run.groupId !== group.id || run.status !== "active") throw new Error("No active dungeon run is available for this group.");
  if (group.leaderUserId !== userId) throw new Error("Only the group leader can resolve this dungeon run.");
  const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id));
  const reward = splitDungeonRewards(members.length, totalXp, totalLoot);
  await db.update(dungeonRuns).set({ status: "completed", completedAt: new Date() }).where(eq(dungeonRuns.id, run.id));
  await db.update(playerGroups).set({ status: "open" }).where(eq(playerGroups.id, group.id));
  for (const member of members) {
    await db.insert(dungeonRewards).values({ dungeonRunId: run.id, userId: member.userId, xpAwarded: reward.xpEach, lootAwarded: reward.lootEach });
    const profile = (await db.select().from(playerProfiles).where(eq(playerProfiles.userId, member.userId)).limit(1))[0];
    if (profile) await db.update(playerProfiles).set({ totalXp: profile.totalXp + reward.xpEach, streetCred: profile.streetCred + reward.lootEach }).where(eq(playerProfiles.id, profile.id));
    await recordStatistic(member.userId, "dungeon_runs_completed");
  }
  return { runId: run.id, memberCount: members.length, reward };
}

export async function listCompletedDungeonRuns(userId: number) {
  const db = requireDb(await getDb());
  const memberships = await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
  const groupIds = memberships.map((membership) => membership.groupId).sort((left, right) => left - right);
  if (!groupIds.length) return [];
  const runs = await db.select().from(dungeonRuns).where(eq(dungeonRuns.status, "completed"));
  return runs.filter((run) => groupIds.includes(run.groupId)).sort((left, right) => right.id - left.id);
}
