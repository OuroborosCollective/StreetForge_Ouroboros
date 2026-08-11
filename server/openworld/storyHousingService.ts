import { eq } from "drizzle-orm";
import { housingParcels, storyProgress, tutorialProgress } from "../../drizzle/schema";
import { getDb } from "../db";

const storyGraph = {
  "first-contact": { "trust-runner": "forge-access", "back-gang": "crew-access" },
  "forge-access": { "claim-home": "housing-ready" },
  "crew-access": { "claim-home": "housing-ready" },
} as const;

function requireDb<T>(value: T | null): T { if (!value) throw new Error("StreetForge database is unavailable."); return value; }

export async function ensureCityProgress(userId: number) {
  const db = requireDb(await getDb());
  await db.insert(tutorialProgress).values({ userId, stepKey: "enter_district", state: "active" }).onDuplicateKeyUpdate({ set: {} });
  const current = await db.select().from(storyProgress).where(eq(storyProgress.userId, userId)).limit(1);
  if (!current[0]) await db.insert(storyProgress).values({ userId, storyKey: "streetforge-main", nodeKey: "first-contact", state: "active" });
  return getCityProgress(userId);
}

export async function getCityProgress(userId: number) {
  const db = requireDb(await getDb());
  const [story, tutorial, housing] = await Promise.all([
    db.select().from(storyProgress).where(eq(storyProgress.userId, userId)).limit(1),
    db.select().from(tutorialProgress).where(eq(tutorialProgress.userId, userId)).limit(1),
    db.select().from(housingParcels).where(eq(housingParcels.ownerUserId, userId)).limit(1),
  ]);
  return { story: story[0] ?? null, tutorial: tutorial[0] ?? null, housing: housing[0] ?? null };
}

export async function chooseStoryBranch(userId: number, choiceKey: string) {
  const progress = await ensureCityProgress(userId);
  const story = progress.story;
  if (!story || story.state !== "active") throw new Error("No active story node is available.");
  const choices = storyGraph[story.nodeKey as keyof typeof storyGraph];
  const nextNode = choices?.[choiceKey as keyof typeof choices];
  if (!nextNode) throw new Error("That story choice is not valid for the active node.");
  const db = requireDb(await getDb());
  await db.update(storyProgress).set({ nodeKey: nextNode, state: "active", choiceKey }).where(eq(storyProgress.id, story.id));
  return getCityProgress(userId);
}

export async function claimHousing(userId: number, districtKey: string, displayName: string) {
  const progress = await ensureCityProgress(userId);
  if (!progress.story || !["forge-access", "crew-access", "housing-ready"].includes(progress.story.nodeKey)) throw new Error("Complete the first story branch before claiming housing.");
  if (progress.housing) throw new Error("This account already owns a housing parcel.");
  const db = requireDb(await getDb());
  await db.insert(housingParcels).values({ ownerUserId: userId, districtKey, displayName, state: "active" });
  await db.update(storyProgress).set({ nodeKey: "housing-ready", state: "completed", choiceKey: "claim-home" }).where(eq(storyProgress.userId, userId));
  return getCityProgress(userId);
}

export async function completeTutorialAction(userId: number, action: "enter_district" | "accept_quest" | "contact_npc") {
  const progress = await ensureCityProgress(userId);
  if (!progress.tutorial || progress.tutorial.state !== "active") return progress;
  const nextByAction = { enter_district: "accept_quest", accept_quest: "contact_npc", contact_npc: "complete" } as const;
  const next = nextByAction[action];
  const db = requireDb(await getDb());
  await db.update(tutorialProgress).set(next === "complete" ? { stepKey: "complete", state: "completed", completedAt: new Date() } : { stepKey: next }).where(eq(tutorialProgress.userId, userId));
  return getCityProgress(userId);
}
