import { and, eq } from "drizzle-orm";
import { characterEquipment, characters, playerItems } from "../../drizzle/schema";
import { getDb } from "../db";

export const equipmentSlots = ["weapon", "head", "torso", "gloves", "legs", "shoes", "cape", "shoulder", "offhand"] as const;
export type EquipmentSlot = typeof equipmentSlots[number];

function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

export async function getEquipment(userId: number, characterId: number) {
  const db = requireDb(await getDb());
  const character = (await db.select().from(characters).where(and(eq(characters.id, characterId), eq(characters.userId, userId))).limit(1))[0];
  if (!character) throw new Error("This character does not belong to the current account.");
  return db.select().from(characterEquipment).where(eq(characterEquipment.characterId, characterId));
}

export async function equipItem(userId: number, characterId: number, playerItemId: number, slot: EquipmentSlot) {
  const db = requireDb(await getDb());
  const character = (await db.select().from(characters).where(and(eq(characters.id, characterId), eq(characters.userId, userId))).limit(1))[0];
  const item = (await db.select().from(playerItems).where(and(eq(playerItems.id, playerItemId), eq(playerItems.userId, userId))).limit(1))[0];
  if (!character || !item || item.quantity < 1) throw new Error("Only owned items can be equipped on an owned character.");
  await db.transaction(async (tx) => {
    const current = await tx.select().from(characterEquipment).where(and(eq(characterEquipment.characterId, characterId), eq(characterEquipment.slot, slot))).limit(1);
    if (current[0]) await tx.delete(characterEquipment).where(eq(characterEquipment.id, current[0].id));
    await tx.insert(characterEquipment).values({ characterId, playerItemId, slot });
    await tx.update(playerItems).set({ equippedSlot: slot }).where(eq(playerItems.id, playerItemId));
  });
  return getEquipment(userId, characterId);
}
