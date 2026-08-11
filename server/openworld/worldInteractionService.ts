import { and, eq } from "drizzle-orm";
import { cityPresence, contentModules, npcContacts, questProgress } from "../../drizzle/schema";
import { getDb } from "../db";
import { starterWorld } from "./catalog";
import { getDistrictEntryPolicy } from "./cityService";
import { ensureStarterContent } from "./contentService";

function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

export function districtForKey(key: string) {
  const district = starterWorld.districts.find((entry) => entry.moduleKey === key);
  if (!district) throw new Error("Unknown StreetForge district.");
  return district;
}

async function activeModule(userId: number, moduleKey: string, kind: "district" | "quest" | "npc") {
  const modules = await ensureStarterContent(userId);
  const module = modules.get(moduleKey);
  if (!module || module.kind !== kind || module.status !== "active") throw new Error("This StreetForge module is not active.");
  return module;
}

async function requirePresence(userId: number, archetype: string) {
  const db = requireDb(await getDb());
  const presence = (await db.select().from(cityPresence).where(eq(cityPresence.userId, userId)).limit(1))[0];
  const district = presence ? districtForKey(presence.districtKey) : null;
  if (!district || district.archetype !== archetype) throw new Error("Enter the required district before continuing this interaction.");
  return presence;
}

export async function enterDistrict(userId: number, districtKey: string) {
  const district = districtForKey(districtKey);
  const intelligence = await getDistrictEntryPolicy(district);
  if (!intelligence.entryAllowed) throw new Error(intelligence.directive);
  await activeModule(userId, district.moduleKey, "district");
  const db = requireDb(await getDb());
  const now = new Date();
  await db.insert(cityPresence).values({ userId, districtKey: district.moduleKey, enteredAt: now }).onDuplicateKeyUpdate({ set: { districtKey: district.moduleKey, enteredAt: now } });
  return { district, intelligence, state: "entered" as const };
}

export async function acceptQuest(userId: number, questKey: string) {
  const quest = starterWorld.quests.find((entry) => entry.moduleKey === questKey);
  if (!quest) throw new Error("Unknown StreetForge quest.");
  await requirePresence(userId, quest.district);
  const module = await activeModule(userId, quest.moduleKey, "quest");
  const db = requireDb(await getDb());
  const current = (await db.select().from(questProgress).where(and(eq(questProgress.userId, userId), eq(questProgress.questModuleId, module.id))).limit(1))[0];
  if (current?.state === "completed") throw new Error("This quest has already been completed.");
  if (current) await db.update(questProgress).set({ state: "active", currentStep: 0 }).where(eq(questProgress.id, current.id));
  else await db.insert(questProgress).values({ userId, questModuleId: module.id, state: "active", currentStep: 0 });
  return { quest, state: "accepted" as const };
}

export async function contactNpc(userId: number, npcKey: string) {
  const npc = starterWorld.npcs.find((entry) => entry.moduleKey === npcKey);
  if (!npc) throw new Error("Unknown StreetForge contact.");
  await requirePresence(userId, npc.district);
  await activeModule(userId, npc.moduleKey, "npc");
  const db = requireDb(await getDb());
  const current = (await db.select().from(npcContacts).where(and(eq(npcContacts.userId, userId), eq(npcContacts.npcKey, npc.moduleKey))).limit(1))[0];
  if (current) await db.update(npcContacts).set({ lastContactAt: new Date() }).where(eq(npcContacts.id, current.id));
  else await db.insert(npcContacts).values({ userId, npcKey: npc.moduleKey });
  return { npc, state: "channel_open" as const };
}
