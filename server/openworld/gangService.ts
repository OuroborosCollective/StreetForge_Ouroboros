// Gang service: ownership and territory claims are database-owned gates for player-created environments.
import { and, eq } from "drizzle-orm";
import { gangMemberships, gangs, territories } from "../../drizzle/schema";
import { getDb } from "../db";
import { territoryDistrictKey, validateGangIdentity } from "./gangRules";

function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

export async function createGang(userId: number, input: { name: string; tag: string }) {
  const db = requireDb(await getDb());
  const identity = validateGangIdentity(input.name, input.tag);
  const existingMembership = (await db.select().from(gangMemberships).where(eq(gangMemberships.userId, userId)).limit(1))[0];
  if (existingMembership) throw new Error("Leave your current gang before founding another.");
  return db.transaction(async (tx) => {
    const result = await tx.insert(gangs).values({ name: identity.name, tag: identity.tag, ownerUserId: userId });
    const [header] = result as unknown as [{ insertId: number }];
    const gangId = Number(header.insertId);
    await tx.insert(gangMemberships).values({ gangId, userId, rank: "owner" });
    return { gangId, ...identity };
  });
}

export async function listGangs() {
  const db = requireDb(await getDb());
  const allGangs = await db.select().from(gangs);
  const claimed = await db.select().from(territories);
  return allGangs.map((gang) => ({
    id: gang.id,
    name: gang.name,
    tag: gang.tag,
    reputation: gang.reputation,
    territory: claimed.find((item) => item.gangId === gang.id)?.displayName ?? null,
  }));
}

export async function joinGang(userId: number, gangId: number) {
  const db = requireDb(await getDb());
  const membership = (await db.select().from(gangMemberships).where(eq(gangMemberships.userId, userId)).limit(1))[0];
  if (membership) throw new Error("Leave your current gang before joining another.");
  const gang = (await db.select().from(gangs).where(eq(gangs.id, gangId)).limit(1))[0];
  if (!gang) throw new Error("The selected gang no longer exists.");
  await db.insert(gangMemberships).values({ gangId: gang.id, userId, rank: "member" });
  return { gangId: gang.id, name: gang.name, tag: gang.tag, rank: "member" as const };
}

export async function claimGangTerritory(userId: number, input: { worldSeed: number; districtX: number; districtZ: number; displayName: string }) {
  const db = requireDb(await getDb());
  const membership = (await db.select().from(gangMemberships).where(eq(gangMemberships.userId, userId)).limit(1))[0];
  if (!membership || !["owner", "officer"].includes(membership.rank)) throw new Error("Only a gang owner or officer can claim territory.");
  const name = input.displayName.trim().replace(/\s+/g, " ");
  if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{2,79}$/.test(name)) throw new Error("Territory name must be 3–80 readable characters.");
  const districtKey = territoryDistrictKey(input.worldSeed, input.districtX, input.districtZ);
  const existing = (await db.select().from(territories).where(eq(territories.gangId, membership.gangId)).limit(1))[0];
  if (existing) throw new Error("This gang already controls a territory.");
  const occupied = (await db.select().from(territories).where(eq(territories.districtKey, districtKey)).limit(1))[0];
  if (occupied) throw new Error("Another gang already controls this district.");
  const inserted = await db.insert(territories).values({ gangId: membership.gangId, districtKey, districtX: input.districtX, districtZ: input.districtZ, worldSeed: input.worldSeed, displayName: name, state: "active" });
  const [header] = inserted as unknown as [{ insertId: number }];
  return { territoryId: Number(header.insertId), districtKey, displayName: name };
}
