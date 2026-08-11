// Content bootstrap: starter world definitions are inserted as active, versioned modules once and remain editable through admin tooling.
import { eq } from "drizzle-orm";
import { contentModules, playerItems } from "../../drizzle/schema";
import { getDb } from "../db";
import { starterWeapons, starterWorld } from "./catalog";

function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

const starterEntries = [
  ...starterWeapons.map((weapon) => ({ moduleKey: weapon.moduleKey, kind: "item" as const, title: weapon.title, payload: weapon })),
  ...starterWorld.districts.map((district) => ({ moduleKey: district.moduleKey, kind: "district" as const, title: district.title, payload: district })),
  ...starterWorld.npcs.map((npc) => ({ moduleKey: npc.moduleKey, kind: "npc" as const, title: npc.name, payload: npc })),
  ...starterWorld.quests.map((quest) => ({ moduleKey: quest.moduleKey, kind: "quest" as const, title: quest.title, payload: quest })),
];

export async function ensureStarterContent(createdByUserId: number) {
  const db = requireDb(await getDb());
  for (const entry of starterEntries) {
    const existing = (await db.select().from(contentModules).where(eq(contentModules.moduleKey, entry.moduleKey)).limit(1))[0];
    if (!existing) await db.insert(contentModules).values({ moduleKey: entry.moduleKey, version: 1, kind: entry.kind, title: entry.title, status: "active", payload: entry.payload, createdByUserId });
  }
  const modules = await db.select().from(contentModules);
  return new Map(modules.map((module) => [module.moduleKey, module]));
}

export async function ensureStarterInventory(userId: number) {
  const db = requireDb(await getDb());
  const modules = await ensureStarterContent(userId);
  const existingItems = await db.select().from(playerItems).where(eq(playerItems.userId, userId));
  if (existingItems.length === 0) {
    const splitBar = modules.get("weapon.melee.split-bar");
    const cinder = modules.get("weapon.sidearm.cinder-9");
    if (splitBar) await db.insert(playerItems).values({ userId, itemModuleId: splitBar.id, quantity: 1, equippedSlot: "primary" });
    if (cinder) await db.insert(playerItems).values({ userId, itemModuleId: cinder.id, quantity: 1, equippedSlot: null });
  }
  return db.select({ id: playerItems.id, quantity: playerItems.quantity, equippedSlot: playerItems.equippedSlot, moduleKey: contentModules.moduleKey, title: contentModules.title }).from(playerItems).innerJoin(contentModules, eq(playerItems.itemModuleId, contentModules.id)).where(eq(playerItems.userId, userId));
}

