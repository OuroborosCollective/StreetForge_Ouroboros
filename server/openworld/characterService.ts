import { and, desc, eq } from "drizzle-orm";
import { characters } from "../../drizzle/schema";
import { getDb } from "../db";
import { ensurePlayerProfile } from "./profileService";

export const characterArchetypes = ["runner", "enforcer", "scout", "fixer"] as const;
export const characterPresentations = ["street", "industrial", "night_ops"] as const;

function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

export function normalizeCharacterCallsign(value: string) {
  const callsign = value.trim().replace(/\s+/g, " ");
  if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{2,31}$/.test(callsign)) throw new Error("Character callsign must be 3–32 readable characters.");
  return callsign;
}

export function requireOwnedCharacter<T extends { userId: number }>(character: T | undefined, userId: number) {
  if (!character || character.userId !== userId) throw new Error("This character does not belong to the current account.");
  return character;
}

export async function listAccountCharacters(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(characters).where(eq(characters.userId, userId)).orderBy(desc(characters.lastPlayedAt), desc(characters.createdAt));
}

export async function getActiveCharacter(userId: number) {
  const db = requireDb(await getDb());
  return (await db.select().from(characters).where(and(eq(characters.userId, userId), eq(characters.isActive, true))).limit(1))[0] ?? null;
}

export async function createAccountCharacter(userId: number, input: { callsign: string; archetype: typeof characterArchetypes[number]; presentation: typeof characterPresentations[number] }) {
  const db = requireDb(await getDb());
  const callsign = normalizeCharacterCallsign(input.callsign);
  const existing = await listAccountCharacters(userId);
  if (existing.length >= 8) throw new Error("An account can own up to eight StreetForge characters.");
  const result = await db.insert(characters).values({ userId, callsign, archetype: input.archetype, presentation: input.presentation, isActive: existing.length === 0 });
  const [header] = result as unknown as [{ insertId: number }];
  return (await db.select().from(characters).where(eq(characters.id, Number(header.insertId))).limit(1))[0];
}

export async function enterWithCharacter(userId: number, characterId: number, profileName: string | null) {
  const db = requireDb(await getDb());
  const character = requireOwnedCharacter((await db.select().from(characters).where(and(eq(characters.id, characterId), eq(characters.userId, userId))).limit(1))[0], userId);
  await db.transaction(async (tx) => {
    await tx.update(characters).set({ isActive: false }).where(eq(characters.userId, userId));
    await tx.update(characters).set({ isActive: true, lastPlayedAt: new Date() }).where(eq(characters.id, character.id));
  });
  const profile = await ensurePlayerProfile(userId, character.callsign || profileName || "Street Runner");
  return { character: { ...character, isActive: true, lastPlayedAt: new Date() }, profile };
}
